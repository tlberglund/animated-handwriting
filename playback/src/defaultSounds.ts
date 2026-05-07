import straight01 from './sounds/straight-01.mp3';
import straight02 from './sounds/straight-02.mp3';
import straight03 from './sounds/straight-03.mp3';
import straight04 from './sounds/straight-04.mp3';
import curve01    from './sounds/curve-01.mp3';
import curve02    from './sounds/curve-02.mp3';
import curve03    from './sounds/curve-03.mp3';
import sharp01    from './sounds/sharp-01.mp3';
import sharp02    from './sounds/sharp-02.mp3';
import scribble01 from './sounds/scribble-01.mp3';
import scribble02 from './sounds/scribble-02.mp3';

import type { SoundConfig } from './types';

export const defaultSounds: SoundConfig = {
   straight: [straight01, straight02, straight03, straight04],
   curve:    [curve01, curve02, curve03],
   sharp:    [sharp01, sharp02],
   scribble: [scribble01, scribble02],
};
