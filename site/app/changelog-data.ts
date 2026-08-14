export type ChangelogCommit = {
  label: string;
  sha: string;
  url: string;
};

export type ChangelogLink = {
  label: string;
  url: string;
};

export type ChangelogCategory = {
  label: string;
  items: readonly string[];
};

export type ChangelogRelease = {
  version: string;
  tag: string;
  releaseDate: string;
  releaseTargetSha: string;
  releaseUrl: string;
  sourceRecord: string;
  categories: readonly ChangelogCategory[];
  commits: readonly ChangelogCommit[];
  links: readonly ChangelogLink[];
};

const REPOSITORY = "https://github.com/Ding-Ding-Projects/minecraft-server-command-center";
const COMMIT = `${REPOSITORY}/commit/`;
const RELEASE = `${REPOSITORY}/releases/tag/`;
const ACTIONS = `${REPOSITORY}/actions/runs/`;

const CHANGELOG_RELEASES_WITH_CHANGELOG: readonly ChangelogRelease[] = [
  {
    version: "0.1.39",
    tag: "v0.1.39",
    releaseDate: "2026-08-14",
    releaseTargetSha: "741bbd43950ae90da8ecb65991cd530adac3642a",
    releaseUrl: `${RELEASE}v0.1.39`,
    sourceRecord: "Published release record",
    categories: [
      {
        label: "Release",
        items: [
          "Published the non-draft v0.1.39 release for the exact source commit 741bbd43950ae90da8ecb65991cd530adac3642a with unsigned Windows Squirrel.Windows artifacts.",
          "Dim sum code name: Black Truffle Siu Mai · 黑松露燒賣.",
        ],
      },
      {
        label: "Verification",
        items: [
          "Workflow started at 2026-08-14T08:47:15Z; release publication completed at 2026-08-14T08:49:26.0624208Z; workflow duration was 00:02:11.",
          "The release workflow builds and packages only; it does not run tests or lint.",
        ],
      },
    ],
    commits: [
      {
        label: "Release target",
        sha: "741bbd43950ae90da8ecb65991cd530adac3642a",
        url: `${COMMIT}741bbd43950ae90da8ecb65991cd530adac3642a`,
      },
    ],
    links: [
      { label: "Published release record", url: `${RELEASE}v0.1.39` },
    ],
  },
  {
    version: "0.1.38",
    tag: "v0.1.38",
    releaseDate: "2026-08-14",
    releaseTargetSha: "fbd75307e14bbe049adf73c40bb74fc375f970c3",
    releaseUrl: `${RELEASE}v0.1.38`,
    sourceRecord: "CHANGELOG.md",
    categories: [
      {
        label: "Changed",
        items: [
          "Refreshed the companion site's embedded installer handoff to the published v0.1.38 release for commit fbd75307e14bbe049adf73c40bb74fc375f970c3.",
          "Published unsigned Windows Squirrel.Windows artifacts with dim sum code name Fish Maw Siu Mai · 花膠燒賣.",
        ],
      },
      {
        label: "Verification",
        items: [
          "GitHub Actions run 31782817096 completed successfully and published the non-draft v0.1.38 release for the exact target commit.",
          "Release timing was 00:02:17; Setup.exe, RELEASES, and the full .nupkg were published unsigned and each download URL returned HTTP 200.",
          "The release line-count table reported 23,816 non-generated total lines and 21,357 non-blank lines, with 23,821 grand-total lines and 21,361 grand-total non-blank lines.",
        ],
      },
    ],
    commits: [
      {
        label: "Release handoff",
        sha: "fbd75307e14bbe049adf73c40bb74fc375f970c3",
        url: `${COMMIT}fbd75307e14bbe049adf73c40bb74fc375f970c3`,
      },
    ],
    links: [
      { label: "GitHub Actions run 31782817096", url: `${ACTIONS}31782817096` },
      { label: "Published release record", url: `${RELEASE}v0.1.38` },
    ],
  },
  {
    version: "0.1.33",
    tag: "v0.1.33",
    releaseDate: "2026-08-14",
    releaseTargetSha: "44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10",
    releaseUrl: `${RELEASE}v0.1.33`,
    sourceRecord: "CHANGELOG.md",
    categories: [
      {
        label: "Changed",
        items: [
          "Published the bounded universal-settings foundation and its linked evidence records.",
          "Published unsigned Windows Squirrel.Windows artifacts with dim sum code name Quail Egg Siu Mai · 鵪鶉蛋燒賣.",
        ],
      },
      {
        label: "Verification",
        items: [
          "GitHub Actions run 31775779448 completed successfully and published the non-draft v0.1.33 release for the exact target commit.",
          "Release timing was 00:02:21; Setup.exe, RELEASES, and the full .nupkg were published unsigned and each download URL returned HTTP 200.",
          "The release line-count table reported 20,855 non-generated total lines and 18,676 non-blank lines, with 20,860 grand-total lines and 18,680 grand-total non-blank lines.",
        ],
      },
    ],
    commits: [
      {
        label: "Universal-settings foundation",
        sha: "130f2b1b45586c16c07efc1957b3cb150f67e922",
        url: `${COMMIT}130f2b1b45586c16c07efc1957b3cb150f67e922`,
      },
      {
        label: "Release target and linked evidence",
        sha: "44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10",
        url: `${COMMIT}44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10`,
      },
    ],
    links: [
      { label: "GitHub Actions run 31775779448", url: `${ACTIONS}31775779448` },
      { label: "Published release record", url: `${RELEASE}v0.1.33` },
    ],
  },
  {
    version: "0.1.32",
    tag: "v0.1.32",
    releaseDate: "2026-08-14",
    releaseTargetSha: "7974e8b975838ed167710e1aa130024fd457f897",
    releaseUrl: `${RELEASE}v0.1.32`,
    sourceRecord: "CHANGELOG.md",
    categories: [
      {
        label: "Changed",
        items: [
          "Recorded the universal surface coverage baseline at commit 7974e8b975838ed167710e1aa130024fd457f897.",
          "Published unsigned Windows Squirrel.Windows artifacts with dim sum code name Crab Roe Siu Mai · 蟹籽燒賣.",
        ],
      },
      {
        label: "Verification",
        items: [
          "GitHub Actions run 31771514026 completed successfully and published the non-draft v0.1.32 release.",
          "Release timing was 00:02:22; the release contains Setup.exe, RELEASES, and the full .nupkg, all unsigned. The release workflow builds and packages but does not run tests or lint.",
          "The release line-count table reported 19,382 non-generated total lines and 17,327 non-blank lines, with 19,387 grand-total lines and 17,331 grand-total non-blank lines.",
        ],
      },
    ],
    commits: [
      {
        label: "Release target",
        sha: "7974e8b975838ed167710e1aa130024fd457f897",
        url: `${COMMIT}7974e8b975838ed167710e1aa130024fd457f897`,
      },
    ],
    links: [
      { label: "GitHub Actions run 31771514026", url: `${ACTIONS}31771514026` },
      { label: "Published release record", url: `${RELEASE}v0.1.32` },
    ],
  },
  {
    version: "0.1.31",
    tag: "v0.1.31",
    releaseDate: "2026-08-14",
    releaseTargetSha: "c75f0e0efa5330b4262a7699a8c7f9af29ed14c5",
    releaseUrl: `${RELEASE}v0.1.31`,
    sourceRecord: "CHANGELOG.md",
    categories: [
      {
        label: "Changed",
        items: [
          "Refreshed release handoff evidence at commit c75f0e0efa5330b4262a7699a8c7f9af29ed14c5.",
          "Published unsigned Windows Squirrel.Windows artifacts with dim sum code name Classic Siu Mai · 燒賣.",
        ],
      },
      {
        label: "Verification",
        items: [
          "The published v0.1.31 release came from the verified release workflow.",
          "Its line-count table reported 19,344 non-generated total lines and 17,292 non-blank lines.",
        ],
      },
    ],
    commits: [
      {
        label: "Release handoff evidence",
        sha: "c75f0e0efa5330b4262a7699a8c7f9af29ed14c5",
        url: `${COMMIT}c75f0e0efa5330b4262a7699a8c7f9af29ed14c5`,
      },
    ],
    links: [{ label: "Published release record", url: `${RELEASE}v0.1.31` }],
  },
  {
    version: "0.1.30",
    tag: "v0.1.30",
    releaseDate: "2026-08-14",
    releaseTargetSha: "ffe3c43df50c29d254526d616db5150325179af2",
    releaseUrl: `${RELEASE}v0.1.30`,
    sourceRecord: "CHANGELOG.md",
    categories: [
      {
        label: "Changed",
        items: [
          "Corrected companion-site lint findings around deferred browser-storage restoration, checkbox naming, overlay dismissal, and an unused helper.",
          "Refreshed the embedded installer handoff to the published v0.1.30 Setup.exe asset for commit ffe3c43df50c29d254526d616db5150325179af2.",
        ],
      },
      {
        label: "Verification",
        items: [
          "Local build, installer build, companion-site build, Pages staging, and companion-site lint completed.",
          "GitHub Actions run 31770796058 published the unsigned Windows Squirrel.Windows artifacts.",
          "No automated desktop tests, runtime interaction, or captures were run for this record.",
        ],
      },
    ],
    commits: [
      {
        label: "Release handoff",
        sha: "ffe3c43df50c29d254526d616db5150325179af2",
        url: `${COMMIT}ffe3c43df50c29d254526d616db5150325179af2`,
      },
    ],
    links: [
      { label: "GitHub Actions run 31770796058", url: `${ACTIONS}31770796058` },
      { label: "Published release record", url: `${RELEASE}v0.1.30` },
    ],
  },
];

function makePublishedRelease(input: {
  version: string;
  tag: string;
  releaseDate: string;
  releaseTargetSha: string;
  releaseUrl: string;
  workflowStarted?: string;
  duration?: string;
  dish?: string;
  projectTotal?: readonly [number, number];
  grandTotal?: readonly [number, number];
}): ChangelogRelease {
  const verificationItems = [
    input.workflowStarted ? `Workflow started at ${input.workflowStarted}.` : "",
    input.duration ? `Workflow duration was ${input.duration}.` : "",
    "The published workflow record states that it builds and packages only; it does not run tests or lint.",
    input.projectTotal && input.grandTotal
      ? `The release line-count record reported ${input.projectTotal[0].toLocaleString("en-US")} project total lines and ${input.projectTotal[1].toLocaleString("en-US")} project non-blank lines; the grand total was ${input.grandTotal[0].toLocaleString("en-US")} lines and ${input.grandTotal[1].toLocaleString("en-US")} non-blank lines.`
      : "",
  ].filter(Boolean);

  return {
    version: input.version,
    tag: input.tag,
    releaseDate: input.releaseDate,
    releaseTargetSha: input.releaseTargetSha,
    releaseUrl: input.releaseUrl,
    sourceRecord: "Published release record",
    categories: [
      {
        label: "Release",
        items: [
          `Published the non-draft ${input.tag} release for the exact source commit ${input.releaseTargetSha} with unsigned Windows Squirrel.Windows artifacts.`,
          ...(input.dish ? [`Dim sum code name: ${input.dish}.`] : []),
        ],
      },
      {
        label: "Recorded changes",
        items: ["No categorized change text was included in this published release record."],
      },
      ...(verificationItems.length ? [{ label: "Verification", items: verificationItems }] : []),
    ],
    commits: [{
      label: "Release target",
      sha: input.releaseTargetSha,
      url: `${COMMIT}${input.releaseTargetSha}`,
    }],
    links: [{ label: "Published release record", url: input.releaseUrl }],
  };
}

const PUBLISHED_RELEASE_RECORDS: readonly ChangelogRelease[] = [
  makePublishedRelease({
    version: "0.1.37",
    tag: "v0.1.37",
    releaseDate: "2026-08-14",
    releaseTargetSha: "e7b5b1c8f67b2388249285716290a2cd34e19d57",
    releaseUrl: `${RELEASE}v0.1.37`,
    workflowStarted: "2026-08-14T07:57:13.0000000+00:00",
    duration: "00:02:55",
    dish: "Mushroom Siu Mai · 北菇燒賣",
    projectTotal: [23061, 20673],
    grandTotal: [23066, 20677],
  }),
  makePublishedRelease({
    version: "0.1.36",
    tag: "v0.1.36",
    releaseDate: "2026-08-14",
    releaseTargetSha: "edb5f22562059659329259001af388ab98e1ba44",
    releaseUrl: `${RELEASE}v0.1.36`,
    workflowStarted: "2026-08-14T06:56:34.0000000+00:00",
    duration: "00:02:12",
    dish: "Chicken Siu Mai · 雞肉燒賣",
    projectTotal: [22445, 20118],
    grandTotal: [22450, 20122],
  }),
  makePublishedRelease({
    version: "0.1.35",
    tag: "v0.1.35",
    releaseDate: "2026-08-14",
    releaseTargetSha: "43b4d403e4e911b92ea1dcb1a22a8bd8f6955196",
    releaseUrl: `${RELEASE}v0.1.35`,
    workflowStarted: "2026-08-14T06:50:17.0000000+00:00",
    duration: "00:02:10",
    dish: "Beef Siu Mai · 牛肉燒賣",
    projectTotal: [21246, 19030],
    grandTotal: [21251, 19034],
  }),
  makePublishedRelease({
    version: "0.1.34",
    tag: "v0.1.34",
    releaseDate: "2026-08-14",
    releaseTargetSha: "8ea397738ce81e4d730043a8bc1faac7d4119751",
    releaseUrl: `${RELEASE}v0.1.34`,
    workflowStarted: "2026-08-14T06:32:07.0000000+00:00",
    duration: "00:03:03",
    dish: "Scallop Siu Mai · 帶子燒賣",
    projectTotal: [20879, 18695],
    grandTotal: [20884, 18699],
  }),
  makePublishedRelease({
    version: "0.1.29",
    tag: "v0.1.29",
    releaseDate: "2026-08-13",
    releaseTargetSha: "f5875a2a0fe08cc09bbafc6ea3742c38ab989868",
    releaseUrl: `${RELEASE}v0.1.29`,
    workflowStarted: "2026-08-13T21:10:07.0000000+00:00",
    duration: "00:02:59",
    dish: "Dried Scallop Shrimp Dumpling · 瑤柱蝦餃",
    projectTotal: [19306, 17262],
    grandTotal: [19311, 17266],
  }),
  makePublishedRelease({
    version: "0.1.28",
    tag: "v0.1.28",
    releaseDate: "2026-08-13",
    releaseTargetSha: "b8a344388f9481b485fb2e23ac2bf12b1d1affd1",
    releaseUrl: `${RELEASE}v0.1.28`,
    workflowStarted: "2026-08-13T19:44:04.0000000+00:00",
    duration: "00:02:41",
    dish: "Lobster Dumpling · 龍蝦餃",
    projectTotal: [18942, 16930],
    grandTotal: [18947, 16934],
  }),
  makePublishedRelease({
    version: "0.1.27",
    tag: "v0.1.27",
    releaseDate: "2026-08-13",
    releaseTargetSha: "17b0eed0d97cd682a4075379e14966740870123a",
    releaseUrl: `${RELEASE}v0.1.27`,
    workflowStarted: "2026-08-13T19:12:30.0000000+00:00",
    duration: "00:02:45",
    dish: "Pea Shoot Shrimp Dumpling · 豆苗蝦餃",
    projectTotal: [18035, 16103],
    grandTotal: [18040, 16107],
  }),
  makePublishedRelease({
    version: "0.1.26",
    tag: "v0.1.26",
    releaseDate: "2026-08-13",
    releaseTargetSha: "9bec9c2448839b701d33c697f8e17e74470ba9bf",
    releaseUrl: `${RELEASE}v0.1.26`,
    workflowStarted: "2026-08-13T18:27:52.0000000+00:00",
    duration: "00:02:43",
    dish: "Spinach Shrimp Dumpling · 菠菜蝦餃",
    projectTotal: [16901, 15083],
    grandTotal: [16906, 15087],
  }),
  makePublishedRelease({
    version: "0.1.25",
    tag: "v0.1.25",
    releaseDate: "2026-08-13",
    releaseTargetSha: "ecc25da9e329e7672006f416a7b77b44af2112ad",
    releaseUrl: `${RELEASE}v0.1.25`,
    workflowStarted: "2026-08-13T18:10:44.0000000+00:00",
    duration: "00:02:26",
    dish: "Chive Shrimp Dumpling · 韭菜蝦餃",
    projectTotal: [16786, 14980],
    grandTotal: [16791, 14984],
  }),
  makePublishedRelease({
    version: "0.1.24",
    tag: "v0.1.24",
    releaseDate: "2026-08-13",
    releaseTargetSha: "4ab99ec34a4fc340e216ef9a4822c98031647cd7",
    releaseUrl: `${RELEASE}v0.1.24`,
    workflowStarted: "2026-08-13T18:04:12.0000000+00:00",
    duration: "00:03:07",
    dish: "Crab Roe Har Gow · 蟹籽蝦餃",
    projectTotal: [16786, 14980],
    grandTotal: [16791, 14984],
  }),
  makePublishedRelease({
    version: "0.1.23",
    tag: "v0.1.23",
    releaseDate: "2026-08-13",
    releaseTargetSha: "ff98eb3b59be4c64bbd07233b0737e8b2d23dc14",
    releaseUrl: `${RELEASE}v0.1.23`,
    workflowStarted: "2026-08-13T17:55:34.0000000+00:00",
    duration: "00:02:40",
    dish: "Bamboo Shoot Har Gow · 筍尖蝦餃",
    projectTotal: [16555, 14778],
    grandTotal: [16560, 14782],
  }),
  makePublishedRelease({
    version: "0.1.22",
    tag: "v0.1.22",
    releaseDate: "2026-08-13",
    releaseTargetSha: "4405d02bd0e717e62d2e70dd9973c6668990d1b1",
    releaseUrl: `${RELEASE}v0.1.22`,
    workflowStarted: "2026-08-13T17:45:58.0000000+00:00",
    duration: "00:02:38",
    dish: "Scallop Har Gow · 帶子蝦餃",
    projectTotal: [16555, 14778],
    grandTotal: [16560, 14782],
  }),
  makePublishedRelease({
    version: "0.1.21",
    tag: "v0.1.21",
    releaseDate: "2026-08-13",
    releaseTargetSha: "3d2023053f0096c286419018af940f0d8fba77d8",
    releaseUrl: `${RELEASE}v0.1.21`,
    workflowStarted: "2026-08-13T17:37:33.7055279+00:00",
    dish: "Classic Har Gow · 蝦餃",
    projectTotal: [16452, 14692],
    grandTotal: [16457, 14696],
  }),
  makePublishedRelease({
    version: "0.1.20",
    tag: "v0.1.20",
    releaseDate: "2026-08-13",
    releaseTargetSha: "2b881116bd636e4af35b6fb0401177eabd7c68d0",
    releaseUrl: `${RELEASE}v0.1.20`,
    workflowStarted: "2026-08-13T17:28:22.2797891+00:00",
    projectTotal: [16121, 14397],
    grandTotal: [16126, 14401],
  }),
  makePublishedRelease({
    version: "0.1.19",
    tag: "v0.1.19",
    releaseDate: "2026-08-13",
    releaseTargetSha: "3059db7493fec712c04a9d34394b87f3494b36c3",
    releaseUrl: `${RELEASE}v0.1.19`,
    workflowStarted: "2026-08-13T17:22:28.1849952+00:00",
  }),
  makePublishedRelease({
    version: "0.1.16",
    tag: "v0.1.16",
    releaseDate: "2026-08-13",
    releaseTargetSha: "805aa5e18a0a53b33f6cd916b1ccb7c97eb59b7b",
    releaseUrl: `${RELEASE}v0.1.16`,
    workflowStarted: "2026-08-13T17:16:13.2493341+00:00",
  }),
  makePublishedRelease({
    version: "0.1.15",
    tag: "v0.1.15",
    releaseDate: "2026-08-13",
    releaseTargetSha: "bfb0e88d59178d9bb9da40e79ac6500d7d6fbf07",
    releaseUrl: `${RELEASE}v0.1.15`,
    workflowStarted: "2026-08-13T17:14:57.7598120+00:00",
    duration: "00:02:32",
  }),
  makePublishedRelease({
    version: "0.1.14",
    tag: "v0.1.14",
    releaseDate: "2026-08-13",
    releaseTargetSha: "bfb0e88d59178d9bb9da40e79ac6500d7d6fbf07",
    releaseUrl: `${RELEASE}v0.1.14`,
    workflowStarted: "2026-08-13T17:12:39.2059952+00:00",
    duration: "00:02:00",
  }),
  makePublishedRelease({
    version: "0.1.13",
    tag: "v0.1.13",
    releaseDate: "2026-08-13",
    releaseTargetSha: "bfb0e88d59178d9bb9da40e79ac6500d7d6fbf07",
    releaseUrl: `${RELEASE}v0.1.13`,
    workflowStarted: "2026-08-13T17:10:09.5025113+00:00",
    duration: "00:02:14",
  }),
  makePublishedRelease({
    version: "0.1.12",
    tag: "v0.1.12",
    releaseDate: "2026-08-13",
    releaseTargetSha: "bfb0e88d59178d9bb9da40e79ac6500d7d6fbf07",
    releaseUrl: `${RELEASE}v0.1.12`,
    workflowStarted: "2026-08-13T17:07:51.4370565+00:00",
    duration: "00:02:01",
  }),
];

export const CHANGELOG_RELEASES: readonly ChangelogRelease[] = [
  ...CHANGELOG_RELEASES_WITH_CHANGELOG,
  ...PUBLISHED_RELEASE_RECORDS,
].sort((left, right) => right.version.localeCompare(left.version, undefined, { numeric: true }));
