export const mainSearchInputId = "main-search-input";

export function focusToMainInput() {
  const input = document.getElementById(
    mainSearchInputId
  ) as HTMLInputElement | null;
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
}
