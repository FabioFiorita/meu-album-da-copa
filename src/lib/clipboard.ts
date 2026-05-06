export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function pasteFromClipboard(): Promise<string> {
  return await navigator.clipboard.readText();
}
