import { GameState } from '../types';
import * as C from '../constants';

export const updateCamera = (state: GameState) => {
    const targetX = -state.player.x + C.CANVAS_WIDTH / 2 - state.player.width / 2;
    const targetY = -state.player.y + C.CANVAS_HEIGHT / 2 - state.player.height / 2;
    
    // Smooth lerp
    state.camera.x += (targetX - state.camera.x) * 0.1;
    state.camera.y += (targetY - state.camera.y) * 0.1;

    if (state.camera.shake > 0) {
        state.camera.x += (Math.random() - 0.5) * state.camera.shake;
        state.camera.y += (Math.random() - 0.5) * state.camera.shake;
        state.camera.shake *= 0.9;
        if (state.camera.shake < 0.5) state.camera.shake = 0;
    }
};
