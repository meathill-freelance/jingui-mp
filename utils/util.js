export function fill(arr, length, content) {
  for (let i = 0; i < length; i++) {
    arr.push(content);
  }
  return arr;
}

export function toMinute(sec) {
  sec = Math.round(sec);
  return `${fillTen(sec / 60 >> 0)}:${fillTen(sec % 60)}`;
}

export function fillTen(number) {
  return number > 9 ? number : ('0' + number);
}