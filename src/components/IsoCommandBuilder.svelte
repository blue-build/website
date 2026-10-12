<script lang="ts">
  import { onMount } from "svelte";
  let isoName = $state("weird-os.iso");
  let imageAddress = $state("ghcr.io/octocat/weird-os");
  let recipePath = $state("recipes/recipe.yml");
  let mode = $state("image");
  let copyStatus = $state("");
  let copiedFor = $state("");
  let ready = $state(false);
  let commandElement: HTMLElement;
  onMount(() => {
    ready = true;
  });

  function shellArgument(value: string) {
    return /^[A-Za-z0-9_./:@=-]+$/.test(value) && !value.startsWith("-")
      ? value
      : "'" + value.replaceAll("'", "'\"'\"'") + "'";
  }
  function validate(name: string, source: string, mode: string) {
    if (!name || !source) return "Fill in both fields to copy your command.";
    if (/[\r\n\x00-\x1f\x7f]/.test(name + source))
      return "Enter each value on one line.";
    if (!name.endsWith(".iso")) return "The ISO filename should end with .iso.";
    if (name.startsWith("-") || source.startsWith("-"))
      return "Values should not begin with a dash.";
    if (
      mode === "image" &&
      (/^https?:\/\//i.test(source) || source.startsWith("github.com/"))
    )
      return "Use an image address such as ghcr.io/yourname/my-project:latest, not a webpage URL.";
    if (mode === "image" && /\s/.test(source))
      return "Container image addresses cannot contain spaces.";
    return "";
  }
  let name = $derived(isoName.trim());
  let source = $derived((mode === "image" ? imageAddress : recipePath).trim());
  let problem = $derived(validate(name, source, mode));
  let command = $derived(
    `sudo bluebuild generate-iso --iso-name ${shellArgument(name || "my-project.iso")} ${mode} ${shellArgument(source || (mode === "image" ? "ghcr.io/yourname/my-project:latest" : "recipes/recipe.yml"))}`,
  );
  let visibleCopyStatus = $derived(copiedFor === command ? copyStatus : "");
  async function copyCommand() {
    const copiedCommand = command;
    try {
      await navigator.clipboard.writeText(copiedCommand);
      if (command === copiedCommand) {
        copiedFor = command;
        copyStatus = "Command copied. Paste it into your terminal.";
      }
    } catch {
      const range = document.createRange();
      range.selectNodeContents(commandElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      copiedFor = command;
      copyStatus =
        "Copy was unavailable. The command is selected; press Ctrl+C.";
    }
  }
</script>

<noscript
  ><p>Enable JavaScript to personalize and copy the command below.</p></noscript
>
<section class="iso-builder" aria-labelledby="iso-builder-title">
  <h3 id="iso-builder-title">Build your ISO command</h3>
  <p>Enter your details, then copy the command into your terminal.</p>
  <fieldset class="iso-options" disabled={!ready}>
    <legend>Generate from</legend>
    <label
      ><input type="radio" name="iso-source" value="image" bind:group={mode} /> Published
      image</label
    >
    <label
      ><input type="radio" name="iso-source" value="recipe" bind:group={mode} /> Local
      recipe</label
    >
  </fieldset>
  <div class="iso-fields">
    <div>
      <label for="iso-name">ISO filename</label><input
        id="iso-name"
        type="text"
        bind:value={isoName}
        placeholder="my-project.iso"
        spellcheck="false"
        aria-describedby="iso-name-help"
      /><small id="iso-name-help">Include the .iso extension.</small>
    </div>
    <div id="image-field" hidden={mode !== "image"}>
      <label for="image-address">Container image address</label><input
        id="image-address"
        type="text"
        bind:value={imageAddress}
        placeholder="ghcr.io/yourname/my-project:latest"
        spellcheck="false"
        aria-describedby="image-help"
      /><small id="image-help"
        >Use a container registry address, rather than a GitHub repository URL.</small
      >
    </div>
    <div id="recipe-field" hidden={mode !== "recipe"}>
      <label for="recipe-path">Recipe file path</label><input
        id="recipe-path"
        type="text"
        bind:value={recipePath}
        spellcheck="false"
        aria-describedby="recipe-help"
      /><small id="recipe-help"
        >Relative to the directory where you run the command.</small
      >
    </div>
  </div>
  <p id="iso-error" role="status" hidden={!problem}>{problem}</p>
  <div class="iso-terminal">
    <div class="iso-terminal-header">
      <span>Terminal command</span><button
        id="copy-iso"
        type="button"
        disabled={!ready || !!problem}
        onclick={copyCommand}>Copy command</button
      >
    </div>
    <pre><code id="iso-command" bind:this={commandElement}>{command}</code
      ></pre>
  </div>
  <p id="copy-status" role="status" aria-live="polite">{visibleCopyStatus}</p>
</section>

<style>
  .iso-builder {
    border: 1px solid var(--sl-color-gray-5, #414452);
    border-radius: 12px;
    padding: 1.25rem;
    margin: 1rem 0 1.5rem;
    background: var(--sl-color-gray-7, transparent);
  }
  .iso-builder h3 {
    margin-top: 0;
  }
  .iso-builder p {
    margin-top: 0.5rem;
  }
  .iso-options {
    border: 0;
    padding: 0;
    margin: 1rem 0;
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .iso-options legend {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .iso-options label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .iso-options input {
    accent-color: var(--sl-color-text-accent, #a7aaff);
  }
  .iso-fields {
    display: grid;
    gap: 1rem;
  }
  .iso-fields label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }
  .iso-fields input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid var(--sl-color-gray-4, #697080);
    border-radius: 6px;
    padding: 0.65rem 0.8rem;
    color: var(--sl-color-text, #eee);
    background: var(--sl-color-black, #181a20);
    font: inherit;
  }
  .iso-fields input:focus-visible,
  .iso-builder button:focus-visible {
    outline: 2px solid var(--sl-color-text-accent, #a7aaff);
    outline-offset: 3px;
  }
  .iso-fields small {
    display: block;
    margin-top: 0.35rem;
    color: var(--sl-color-gray-2, #bfc1cb);
    font-size: 0.85rem;
  }
  .iso-terminal {
    margin-top: 1.25rem;
    border: 1px solid var(--sl-color-gray-5, #414452);
    border-radius: 8px;
    overflow: hidden;
  }
  .iso-terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    background: var(--sl-color-gray-6, #242631);
    padding: 0.65rem 0.9rem;
    font-size: 0.85rem;
  }
  .iso-terminal button {
    border: 1px solid var(--sl-color-gray-4, #697080);
    border-radius: 5px;
    padding: 0.35rem 0.65rem;
    color: var(--sl-color-text, #eee);
    background: var(--sl-color-black, #181a20);
    cursor: pointer;
    font: inherit;
  }
  .iso-terminal button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .iso-terminal pre {
    margin: 0 !important;
    padding: 1rem !important;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    background: var(--sl-color-black, #181a20) !important;
  }
  .iso-terminal code {
    background: none !important;
    padding: 0 !important;
  }
  #iso-error {
    color: var(--sl-color-text-accent, #a7aaff);
  }
  #copy-status {
    min-height: 1.4rem;
    font-size: 0.85rem;
    margin-bottom: 0;
  }
  .iso-builder [hidden] {
    display: none !important;
  }
</style>
