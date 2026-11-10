import React from 'react';

interface DepthGallery3DProps {
    images: string[];
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const DepthGallery3D: React.FC<DepthGallery3DProps>;

interface ShaderImageRevealProps {
    src: string;
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const ShaderImageReveal: React.FC<ShaderImageRevealProps>;

interface DitheringEffectProps {
    src: string;
    intensity?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const DitheringEffect: React.FC<DitheringEffectProps>;

export { DepthGallery3D, DitheringEffect, ShaderImageReveal };
