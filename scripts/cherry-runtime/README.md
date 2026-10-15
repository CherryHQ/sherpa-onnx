# Cherry Studio Windows ARM64 runtime

This fork publishes the Sherpa Node-API runtime independently of Cherry Studio client releases. The source revision, official shared MT SDK checksum, build tools, Electron version, and runtime revision are pinned in `runtime.json`. The model files and immutable Hugging Face revisions are pinned in `models.json`.

The workflow builds on a native `windows-11-arm` runner. It verifies the SDK checksum, applies the Windows linker patch, builds the addon, and checks the architecture and DLL dependencies. Kokoro must produce non-silent Chinese-English audio and FunASR must recognize nonempty text in both Node and an Electron utility process before publication is allowed.

## Validate

Dispatch the workflow without publishing:

```sh
gh workflow run cherry-win-arm64-runtime.yml --repo CherryHQ/sherpa-onnx --ref master -f publish=false
```

The `sherpa-win-arm64-runtime` artifact includes the runtime, dependency inspection, synthetic WAV files, and inference reports. These checks prove native loading and inference; they do not replace testing the installed Cherry Studio application.

## Publish

Pushes to `master` that change this workflow or `scripts/cherry-runtime/**` automatically build and test. The workflow compares `runtime.json` with the commit before the entire push. A change to `version` or `runtimeRevision` automatically publishes after both inference checks pass. Other changes only validate. Pull requests never publish.

To release a rebuild, increase `runtimeRevision` in a reviewed PR and merge it to `master`. Alternatively, dispatch from the default branch:

```sh
gh workflow run cherry-win-arm64-runtime.yml --repo CherryHQ/sherpa-onnx --ref master -f publish=true
```

The workflow rebuilds and tests before publishing. It creates `sherpa-runtime-v<version>-r<runtimeRevision>` in this fork only. The release contains the runtime archive and SHA256 file. The archive contains the addon, SDK DLLs, license, and build provenance; smoke models and test audio are excluded. No npm publishing or Cherry Studio release is performed. Configure the repository secret `SHERPA_RELEASE_TOKEN` with a token limited to this repository and `Contents: write` plus `Workflows: write` permissions, including any required organization approval. Only the publication step uses this credential; build and planning jobs use `GITHUB_TOKEN`. The workflow never prints the credential.

Tags are immutable: publication skips an existing tag without replacing assets. Increase `runtimeRevision` for a rebuild. After a failed publication, inspect any tag or draft release before retrying; an existing tag is deliberately not repaired automatically. Do not replace files on a published tag.

## Integrate with Cherry Studio

Pin the exact release URL and archive checksum in the application's shared artifact catalog, with `runtime/` as the archive prefix and the addon and DLL filenames as required files. Verify on-demand download and inference in development and packaged applications before enabling Windows ARM64 in the voice support list. Both models share one runtime download.

When upgrading Sherpa, update its source revision, SDK checksum, matching JavaScript package version, and patches together. The build deliberately checks out the pinned source revision rather than implicitly building the fork's current upstream head. Update the pinned Electron version when the application's version changes.
