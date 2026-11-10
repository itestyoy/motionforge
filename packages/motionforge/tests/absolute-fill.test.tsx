// @vitest-environment happy-dom
import React, { act, createRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbsoluteFill } from '../src/components/Media';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('AbsoluteFill', () => {
  it('takes a ref and passes the attributes of a div through, as Remotion does', () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    act(() =>
      root.render(
        <AbsoluteFill
          ref={ref}
          id="stage"
          className="scene"
          data-testid="fill"
          aria-label="Stage"
          onClick={onClick}
          style={{ backgroundColor: 'red', flexDirection: 'row' }}
        >
          <b>child</b>
        </AbsoluteFill>,
      ),
    );
    const div = container.querySelector('div')!;
    expect(ref.current).toBe(div);
    expect(div.id).toBe('stage');
    expect(div.className).toBe('scene');
    expect(div.getAttribute('data-testid')).toBe('fill');
    expect(div.getAttribute('aria-label')).toBe('Stage');
    expect(div.innerHTML).toBe('<b>child</b>');
    // `style` is merged over the defaults.
    expect(div.style.position).toBe('absolute');
    expect(div.style.flexDirection).toBe('row');
    expect(div.style.backgroundColor).toBe('red');
    div.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls a callback ref with the element', () => {
    const seen: Array<HTMLDivElement | null> = [];
    act(() => root.render(<AbsoluteFill ref={(element) => void seen.push(element)} />));
    expect(seen).toEqual([container.querySelector('div')]);
  });
});
