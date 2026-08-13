import { open } from "node:fs/promises";
import {
  PLANNER_HANDOFF_MAX_BYTES,
  PlannerHandoffValidationError,
  parsePlannerHandoffJson,
  type PlannerHandoffV1
} from "../shared/planner-handoff";

/**
 * The selected path is kept in the privileged process only. This helper never
 * returns a path or raw file content to the renderer.
 */
export async function readSelectedPlannerHandoff(filePath: string): Promise<PlannerHandoffV1> {
  const file = await open(filePath, "r");
  try {
    const details = await file.stat();
    if (!details.isFile() || details.size <= 0 || details.size > PLANNER_HANDOFF_MAX_BYTES) {
      throw new PlannerHandoffValidationError("The selected planner handoff file is outside the supported size.");
    }

    // Read at most one byte beyond the declared bound so a file changed after
    // selection cannot turn this narrow parser into an unbounded reader.
    const buffer = Buffer.allocUnsafe(PLANNER_HANDOFF_MAX_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead <= 0 || bytesRead > PLANNER_HANDOFF_MAX_BYTES) {
      throw new PlannerHandoffValidationError("The selected planner handoff file is outside the supported size.");
    }

    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, bytesRead));
    } catch {
      throw new PlannerHandoffValidationError("The selected planner handoff file is not valid UTF-8 JSON.");
    }
    return parsePlannerHandoffJson(source);
  } finally {
    await file.close();
  }
}
