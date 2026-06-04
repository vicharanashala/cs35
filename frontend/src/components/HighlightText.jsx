import React from 'react';

export default function HighlightText({ text, matches = [] }) {
  if (!matches || matches.length === 0) {
    return <>{text}</>;
  }

  // Flatten and sort the intervals
  const intervals = [...matches].sort((a, b) => a[0] - b[0]);
  
  // Merge overlapping intervals
  const merged = [];
  for (const interval of intervals) {
    if (merged.length === 0) {
      merged.push([...interval]);
    } else {
      const last = merged[merged.length - 1];
      if (interval[0] <= last[1] + 1) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        merged.push([...interval]);
      }
    }
  }

  const parts = [];
  let lastIndex = 0;

  merged.forEach(([start, end], i) => {
    // text before highlight
    if (start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.substring(lastIndex, start)}</span>);
    }
    // highlighted text
    parts.push(
      <mark key={`mark-${i}`} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5 font-semibold">
        {text.substring(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  // text after last highlight
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
