## MODIFIED Requirements

### Requirement: Animation options forwarded to HandwritingAnimator
The `<Handwriting>` component SHALL accept `speed`, `color`, `capHeight`, `topPad`, `minWidth`, `maxWidth`, `letterGap`, `wordGap`, and `sounds` props corresponding to `WriteOptions`. All SHALL be optional with the same defaults as `HandwritingAnimator`. When `sounds` is provided, the component SHALL call `SoundEngine.preload()` in a `useEffect` on mount (or when `sounds` changes) so that clips are ready before the first animation fires.

#### Scenario: Speed override
- **WHEN** `speed={3.0}` is passed
- **THEN** the animation runs at 3× speed

#### Scenario: Defaults applied when props omitted
- **WHEN** no animation option props are passed
- **THEN** the animation uses speed 1.5, color `#1a1a1a`, and capHeight 80

#### Scenario: Sounds forwarded to animator
- **WHEN** `sounds={{ straight: ["./straight.mp3"], curve: ["./curve.mp3"] }}` is passed
- **THEN** the underlying `HandwritingAnimator.write()` receives the sounds config and plays clips during animation

#### Scenario: Sounds preloaded on mount
- **WHEN** the `<Handwriting>` component mounts with a `sounds` prop
- **THEN** `SoundEngine.preload()` is called immediately so clips are decoded before the animation fires

#### Scenario: No sounds prop — silent animation
- **WHEN** the `<Handwriting>` component renders without a `sounds` prop
- **THEN** the animation plays silently with no audio errors
