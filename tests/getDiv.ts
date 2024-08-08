export function getDiv(
  div: string,
  change: (display: (data: any) => void) => void,
) {
  function display(data: any) {
    span.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  const divElement = document.getElementById(div)!;

  const span = divElement.querySelector('span')!;
  const button = divElement.querySelector('button')!;

  button.addEventListener('click', () => change(display));

  return {
    display,
  };
}
