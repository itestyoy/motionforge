import { VideoIcon, Loader2Icon, DownloadIcon } from './chunk-SQF3SIZE.js';
import { renderCompositionToVideo, downloadVideo } from './chunk-NVLPO7LR.js';
import { usePlaybackLoop, FrameContext } from './chunk-CNOLXIYJ.js';
import { useState, useRef, useCallback, useEffect } from 'react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

var Timeline = ({ durationInFrames, frame, onSeek, marks = [], fps }) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleClick = useCallback((e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(Math.floor(percentage * durationInFrames));
  }, [durationInFrames, onSeek]);
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    handleClick(e);
  }, [handleClick]);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      onSeek(Math.floor(percentage * durationInFrames));
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, durationInFrames, onSeek]);
  const progress = frame / (durationInFrames - 1) * 100;
  const timeInSeconds = frame / fps;
  const durationInSeconds = durationInFrames / fps;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor(seconds % 1 * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: timelineRef,
        className: "relative h-2 bg-emerald-950 rounded-full cursor-pointer group border border-emerald-900/50",
        onMouseDown: handleMouseDown,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-75",
              style: { width: `${progress}%` }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-500/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white",
              style: { left: `calc(${progress}% - 8px)` }
            }
          ),
          marks.map((mark, i) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute top-0 w-0.5 h-full bg-emerald-400",
              style: { left: `${mark / durationInFrames * 100}%` }
            },
            i
          ))
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-2 text-xs text-emerald-500 font-mono", children: [
      /* @__PURE__ */ jsx("span", { children: formatTime(timeInSeconds) }),
      /* @__PURE__ */ jsx("span", { children: formatTime(durationInSeconds) })
    ] })
  ] });
};
var Controls = ({
  playing,
  onPlayPause,
  onRestart,
  onStepBack,
  onStepForward,
  playbackRate,
  onPlaybackRateChange,
  frame,
  totalFrames,
  onExport,
  isExporting
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speeds = [0.25, 0.5, 1, 1.5, 2];
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onRestart,
        className: "p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-all duration-200 hover:scale-110",
        title: "Restart",
        children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z", clipRule: "evenodd" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onStepBack,
        className: "p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-all duration-200 hover:scale-110",
        title: "Previous frame (\u2190)",
        children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onPlayPause,
        className: "p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg shadow-emerald-500/30",
        title: playing ? "Pause (Space)" : "Play (Space)",
        children: playing ? /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) }) : /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onStepForward,
        className: "p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-all duration-200 hover:scale-110",
        title: "Next frame (\u2192)",
        children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" }) })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowSpeedMenu(!showSpeedMenu),
          className: "px-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-all duration-200 min-w-[55px] font-mono border border-emerald-900/50",
          title: "Playback speed",
          children: [
            playbackRate,
            "x"
          ]
        }
      ),
      showSpeedMenu && /* @__PURE__ */ jsx("div", { className: "absolute bottom-full left-0 mb-2 bg-[#0a0a0a] rounded-lg shadow-xl border border-emerald-900/50 py-1 min-w-[65px] overflow-hidden", children: speeds.map((speed) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            onPlaybackRateChange(speed);
            setShowSpeedMenu(false);
          },
          className: `w-full px-3 py-2 text-sm text-left transition-colors ${playbackRate === speed ? "text-emerald-400 bg-emerald-950/50" : "text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950/30"}`,
          children: [
            speed,
            "x"
          ]
        },
        speed
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ml-2 px-3 py-1 bg-emerald-950/50 rounded-lg border border-emerald-900/50", children: /* @__PURE__ */ jsxs("span", { className: "text-sm text-emerald-400 font-mono", children: [
      /* @__PURE__ */ jsx("span", { className: "text-emerald-300", children: frame + 1 }),
      /* @__PURE__ */ jsx("span", { className: "text-emerald-600 mx-1", children: "/" }),
      /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: totalFrames })
    ] }) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onExport,
        disabled: isExporting,
        className: `ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 font-medium ${isExporting ? "cursor-not-allowed" : "hover:scale-105 active:scale-95"}`,
        title: "Export Video",
        children: isExporting ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2Icon, { size: 18 }),
          /* @__PURE__ */ jsx("span", { children: "Exporting..." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(DownloadIcon, { size: 18 }),
          /* @__PURE__ */ jsx("span", { children: "Export" })
        ] })
      }
    )
  ] });
};
var Canvas = ({
  canvasRef,
  component: Component,
  width,
  height,
  frame,
  fps,
  durationInFrames,
  playing,
  playbackRate,
  defaultProps = {}
}) => {
  const scale = Math.min(1, 800 / width);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: canvasRef,
      className: "relative rounded-xl overflow-hidden shadow-2xl shadow-emerald-900/30 border border-emerald-900/30",
      style: {
        width: width * scale,
        height: height * scale,
        backgroundColor: "#0a0a0a"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute -inset-px rounded-xl",
            style: {
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), transparent, rgba(20, 184, 166, 0.2))",
              zIndex: -1
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top left"
            },
            children: /* @__PURE__ */ jsx(
              FrameContext.Provider,
              {
                value: {
                  frame,
                  fps,
                  durationInFrames,
                  width,
                  height,
                  playing,
                  playbackRate,
                  setFrame: () => {
                  },
                  setPlaying: () => {
                  },
                  setPlaybackRate: () => {
                  }
                },
                children: /* @__PURE__ */ jsx(Component, { ...defaultProps })
              }
            )
          }
        )
      ]
    }
  );
};
var Player = ({
  component,
  durationInFrames,
  fps = 30,
  width = 1920,
  height = 1080,
  defaultProps = {},
  controls = true,
  loop = true,
  autoPlay = false,
  style,
  className
}) => {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const seekVersionRef = useRef(0);
  const seek = useCallback((targetFrame) => {
    const clampedFrame = Math.max(0, Math.min(targetFrame, durationInFrames - 1));
    frameRef.current = clampedFrame;
    seekVersionRef.current += 1;
    setFrame(clampedFrame);
  }, [durationInFrames]);
  usePlaybackLoop({
    playing,
    fps,
    playbackRate,
    durationInFrames,
    loop,
    frameRef,
    seekVersionRef,
    onFrame: setFrame,
    onEnded: () => setPlaying(false)
  });
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(frameRef.current - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(frameRef.current + 1);
          break;
        case "Home":
          seek(0);
          break;
        case "End":
          seek(durationInFrames - 1);
          break;
        case "j":
        case "J":
          seek(frameRef.current - 10);
          break;
        case "l":
        case "L":
          seek(frameRef.current + 10);
          break;
        case "k":
        case "K":
          setPlaying((p) => !p);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [durationInFrames, seek]);
  const handleSeek = seek;
  const handlePlayPause = useCallback(() => {
    setPlaying((p) => !p);
  }, []);
  const handleRestart = useCallback(() => {
    seek(0);
    setPlaying(true);
  }, [seek]);
  const handleStepBack = useCallback(() => {
    seek(frameRef.current - 1);
  }, [seek]);
  const handleStepForward = useCallback(() => {
    seek(frameRef.current + 1);
  }, [seek]);
  const handleExport = async () => {
    if (isExporting || !canvasRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    setPlaying(false);
    try {
      const elementToCapture = canvasRef.current.querySelector("div");
      const blob = await renderCompositionToVideo(
        (f) => seek(f),
        elementToCapture,
        { width, height, fps, durationInFrames },
        {
          onProgress: (progress) => setExportProgress(progress)
        }
      );
      if (blob) {
        downloadVideo(blob, `motionforge-export-${Date.now()}.webm`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Check console for details.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex flex-col bg-[#0a0a0a] rounded-2xl p-5 border border-emerald-900/30 ${className || ""}`,
      style,
      children: [
        isExporting && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#0f0f0f] border border-emerald-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(VideoIcon, { size: 24, className: "text-emerald-500" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-emerald-400", children: "Exporting Video" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-700", children: "High Quality Render" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Loader2Icon, { size: 24, className: "text-emerald-500" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 bg-emerald-950 rounded-full overflow-hidden border border-emerald-900/30", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300",
                style: { width: `${exportProgress}%` }
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm font-mono", children: [
              /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: "Progress" }),
              /* @__PURE__ */ jsxs("span", { className: "text-emerald-400", children: [
                Math.round(exportProgress),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-emerald-900/20 grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/10 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs text-emerald-700 uppercase mb-1", children: "Resolution" }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-emerald-400", children: [
                  width,
                  "x",
                  height
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/10 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs text-emerald-700 uppercase mb-1", children: "Frames" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-emerald-400", children: durationInFrames })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-center text-emerald-800 italic pt-2", children: "Please keep this tab active for faster rendering." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-5", children: /* @__PURE__ */ jsx(
          Canvas,
          {
            canvasRef,
            component,
            width,
            height,
            frame,
            fps,
            durationInFrames,
            playing,
            playbackRate,
            defaultProps
          }
        ) }),
        controls && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(
            Controls,
            {
              playing,
              onPlayPause: handlePlayPause,
              onRestart: handleRestart,
              onStepBack: handleStepBack,
              onStepForward: handleStepForward,
              playbackRate,
              onPlaybackRateChange: setPlaybackRate,
              frame,
              totalFrames: durationInFrames,
              onExport: handleExport,
              isExporting
            }
          ),
          /* @__PURE__ */ jsx(
            Timeline,
            {
              durationInFrames,
              frame,
              onSeek: handleSeek,
              fps
            }
          )
        ] })
      ]
    }
  );
};
var Player_default = Player;

export { Player, Player_default };
//# sourceMappingURL=chunk-2CL3HJL7.js.map
//# sourceMappingURL=chunk-2CL3HJL7.js.map