export function fill(arr, length, content) {
  for (let i = 0; i < length; i++) {
    arr.push(content);
  }
  return arr;
}