export namespace StringUtils {
  export const repeatUntilLength = (text: string) => (length: number) =>
    text.repeat(Math.floor(length / text.length)) +
    text.substring(0, length % text.length);

  export const align =
    (
      length: number,
      position: 'center' | 'left' | 'right' = 'center',
      fillStr: string = ' ',
    ) =>
    (text: string) => {
      if (length <= text.length) {
        return text;
      }
      const remainingSpace = length - text.length;
      const repeat = repeatUntilLength(fillStr);
      if (position === 'left') {
        return text + repeat(remainingSpace);
      } else if (position === 'right') {
        return repeat(remainingSpace) + text;
      }
      const leftSpace = Math.floor(remainingSpace / 2);
      const rightSpace = remainingSpace - leftSpace;
      return repeat(leftSpace) + text + repeat(rightSpace);
    };
  export const fill = (length: number, fillStr: string) =>
    repeatUntilLength(fillStr)(length);
}
