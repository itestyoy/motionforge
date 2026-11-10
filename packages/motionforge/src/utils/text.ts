// Splits text into user-perceived characters (grapheme clusters), so emoji,
// flags and combining marks stay whole. Uses Intl.Segmenter where the runtime
// has it, otherwise code points (Array.from).

interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

let segmenter: GraphemeSegmenter | null | undefined;

export const splitGraphemes = (text: string): string[] => {
  if (segmenter === undefined) {
    const Segmenter = (Intl as unknown as {
      Segmenter?: new (locale: string, options: { granularity: 'grapheme' }) => GraphemeSegmenter;
    }).Segmenter;
    segmenter = typeof Segmenter === 'function' ? new Segmenter('en', { granularity: 'grapheme' }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
};
