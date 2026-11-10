/**
 * SVG shapes, as in `@remotion/shapes`: make*() functions return the path
 * data, the components render it in their own `<svg>`.
 *
 *   import { Star, makeStar } from 'motionforge/shapes';
 */
export {
  Rect,
  Circle,
  Ellipse,
  Triangle,
  Star,
  Polygon,
  Pie,
  Heart,
  Arrow,
  Spark,
  Callout,
} from './components/shapes/Shapes';
export type {
  AllShapesProps,
  RectProps,
  CircleProps,
  EllipseProps,
  TriangleProps,
  StarProps,
  PolygonProps,
  PieProps,
  HeartProps,
  ArrowProps,
  SparkProps,
  CalloutProps,
} from './components/shapes/Shapes';
export {
  makeRect,
  makeCircle,
  makeEllipse,
  makeTriangle,
  makeStar,
  makePolygon,
  makePie,
  makeHeart,
  makeArrow,
  makeSpark,
  makeCallout,
} from './components/shapes/make-shapes';
export type {
  ShapeInfo,
  MakeRectOptions,
  MakeCircleProps,
  MakeEllipseOptions,
  MakeTriangleProps,
  MakeStarProps,
  MakePolygonProps,
  MakePieProps,
  MakeHeartProps,
  MakeArrowProps,
  MakeSparkProps,
  MakeCalloutProps,
} from './components/shapes/make-shapes';
export type { Instruction } from './utils/path/instructions';
