/** @returns {string} */
export default function sprintf(string, ...args) {
  let i = 0;
  return string.replace(/%s/g, () => String(args[i++]));
}
