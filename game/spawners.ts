import { GameState, EntityType } from '../types';
import * as C from '../constants';

export const createParticles = (state: GameState, x: number, y: number, count: number, color: string, angle?: number) => {
    for(let i=0; i<count; i++) {
        const spread = Math.PI;
        const particleAngle = angle !== undefined ? angle + (Math.random() - 0.5) * spread : (Math.random() - 0.5) * Math.PI * 2;
        const speed = 4 + Math.random() * 4;
        state.particles.push({
            id: `part-${Math.random()}`,
            type: EntityType.PARTICLE,
            x, y,
            width: 4, height: 4,
            vx: Math.cos(particleAngle) * speed + (Math.random()-0.5),
            vy: Math.sin(particleAngle) * speed + (Math.random()-0.5),
            color: color,
            isDead: false,
            lifeTime: 20 + Math.random() * 10,
            maxLifeTime: 30,
            startColor: color,
            endColor: color
        });
    }
};

export const spawnDamageNumber = (state: GameState, x: number, y: number, value: number, isCrit: boolean, color: string) => {
    state.damageNumbers.push({
        id: `dn-${Math.random()}`,
        x: x + (Math.random() - 0.5) * 20, 
        y: y - 20,
        value,
        isCrit,
        lifeTime: C.DAMAGE_TEXT_LIFETIME,
        maxLifeTime: C.DAMAGE_TEXT_LIFETIME,
        vx: (Math.random() - 0.5) * 2,
        vy: -3,
        color
    });
};

export const spawnEcho = (state: GameState, x: number, y: number, tier: number) => {
    state.echoes.push({
        id: `echo-${Math.random()}`,
        type: EntityType.ECHO,
        x, y,
        width: 24, height: 24,
        vx: 0, vy: 0,
        facingX: 1, facingY: 0,
        color: C.COLORS.echo,
        isDead: false,
        tier,
        lifeTime: 600 * state.player.stats.echoDurationMult,
        maxLifeTime: 600,
        targetId: null,
        damage: 5 * tier * state.player.level,
        scale: 1 + (tier - 1) * 0.5
    });
};