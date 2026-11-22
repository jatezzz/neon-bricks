/*
    Texts for Neon Bricks in Spanish and English.

    Spanish is the default. English is used when the browser language is English, or with ?lang=en.
    The choice made with ?lang= is remembered in this browser.

    NeonI18n.t('key', {n: 3})  -> text with {n} replaced
    NeonI18n.number(1240)      -> "1.240" or "1,240"
    NeonI18n.shortDate(day)    -> "18 nov" or "Nov 18"
    NeonI18n.apply(root)       -> fills every element that has data-i18n="key"
*/
(function () {
    'use strict';

    var STRINGS = {
        es: {
            'rec.neon-command': 'Estrategia: gánale a mi bot.',
            'rec.neon-stack': 'Un toque: apila la torre del día.',
            'rec.neon-bricks': 'Rompe ladrillos: un muro nuevo cada día.',
            'page.title': 'Neon Bricks: reto diario',
            'title.start.touch': 'Toca para empezar',
            'title.start.desktop': 'Pulsa Espacio o haz clic para empezar',
            'title.daily': 'Muro del día #{n} · {date}',
            'title.shared': 'Muro compartido #{n} · {date}',
            'title.status': 'Mejor de hoy: {best} · Racha: {streak}',
            'title.more': 'Más juegos en {host}',
            'info.today': 'jugar el muro de hoy',
            'hud.wall': 'Muro {n}',
            'launch.touch': 'Toca para lanzar',
            'launch.desktop': 'Espacio o clic para lanzar',
            'wall.clear': '¡Muro {n} limpio!',
            'wall.bonus': '+{p} puntos',
            'power.wide': 'Barra ancha',
            'power.multi': 'Tres bolas',
            'power.slow': 'Cámara lenta',
            'paused': 'Pausa',
            'paused.hint': 'Esc o P para seguir',
            'paused.hint.touch': 'Toca para seguir',
            'pad.pause': 'Pausa',
            'over.title': 'Muro #{n} · {date}',
            'over.points': 'puntos',
            'over.meta': 'Muro {w} · 🧱 {k} · combo máx. ×{c}',
            'over.meta.plain': 'Muro {w} · 🧱 {k} ladrillos',
            'over.best': 'Mejor de hoy: {best}',
            'over.newbest': '¡Nuevo mejor de hoy!',
            'over.streak.one': 'Racha: 1 día',
            'over.streak.many': 'Racha: {n} días',
            'over.share': 'Compartir resultado',
            'over.again': 'Jugar de nuevo',
            'over.whatsapp': 'Enviar por WhatsApp',
            'over.copy': 'Copiar texto',
            'over.copied': '¡Copiado!',
            'over.try': 'Prueba también',
            'over.more': 'Más juegos en {host}',
            'share.head': 'Neon Bricks · Muro #{n} ({date})',
            'share.line': '{s} pts · muro {w}',
            'share.streak': 'racha {n}',
            'share.dare': '¿Me superas?',
            'share.dare.score': 'Te reto a superar mis {s}.',
            'target.title.bot': 'Meta: superar los {t} del bot',
            'target.title.player': 'Meta: superar {t} puntos',
            'target.verified': 'puntaje verificado',
            'target.declared': 'puntaje declarado por quien te retó',
            'target.hud': 'Meta {t}',
            'target.passed': '¡Superaste los {t}!',
            'over.win': '¡Ganaste por {n}!',
            'over.tie': 'Empate a {t}',
            'over.lose': 'Te faltaron {n}',
            'joke.win.bot.0': 'Humanos 1, máquinas 0.',
            'joke.win.bot.1': 'El bot pide revancha. Que espere.',
            'joke.win.bot.2': 'Ni entrenado me gana.',
            'joke.tie.bot.0': 'Empataste con un bot. No sé qué dice eso de ti.',
            'joke.tie.bot.1': 'Mismo puntaje que la máquina. Sospechoso.',
            'joke.tie.bot.2': 'Empate técnico. Nadie celebra.',
            'joke.lose.bot.0': 'El bot ni siquiera se esforzó.',
            'joke.lose.bot.1': 'La máquina sigue invicta. Por ahora.',
            'joke.lose.bot.2': 'Te ganó un programa de unas pocas líneas.',
            'joke.win.player.0': 'Avísale. Con cariño.',
            'joke.win.player.1': 'Que te devuelva el reto.',
            'joke.win.player.2': 'Eso no se queda así, seguro.',
            'joke.tie.player.0': 'Empate exacto. Eso casi nunca pasa.',
            'joke.tie.player.1': 'Alguien tiene que desempatar.',
            'joke.tie.player.2': 'Mismo puntaje. Qué coincidencia.',
            'joke.lose.player.0': 'Tan cerca. O no tanto.',
            'joke.lose.player.1': 'Una más y ya. Seguro.',
            'joke.lose.player.2': 'No le digas a nadie.',
            'share.win.bot': 'Le gané al bot por {n} 💪 (él hizo {t})',
            'share.tie.bot': 'Empaté a {t} con el bot 🤝',
            'share.lose.bot': 'Me faltaron {n} para los {t} del bot 😅',
            'share.win.player': 'Superé el reto de {t} por {n} 💪',
            'share.tie.player': 'Empaté el reto: {t} 🤝',
            'share.lose.player': 'Me faltaron {n} para el reto de {t} 😅',
            'info.desktop': 'Mueve la barra con el ratón o las flechas, lanza con Espacio o clic y pausa con Esc o P. Cada día hay un muro nuevo, igual para todos.',
            'info.touch': 'Arrastra el dedo para mover la barra y toca para lanzar. Cada día hay un muro nuevo, igual para todos.',
            'info.mute': 'silenciar',
            'info.unmute': 'activar sonido',
            'info.source': 'código en GitHub',
            'info.portal': 'más juegos',
            'rec.neon-raiders': 'Arcade de naves: supera al bot.',
            'rec.neon-highway': 'Carrera synthwave: mejora tu vuelta más rápida.'
        },
        en: {
            'rec.neon-command': 'Strategy: beat my bot.',
            'rec.neon-stack': 'One tap: stack the tower of the day.',
            'rec.neon-bricks': 'Brick breaker: a new wall every day.',
            'page.title': 'Neon Bricks: daily challenge',
            'title.start.touch': 'Tap to start',
            'title.start.desktop': 'Press Space or click to start',
            'title.daily': 'Wall of the day #{n} · {date}',
            'title.shared': 'Shared wall #{n} · {date}',
            'title.status': 'Best today: {best} · Streak: {streak}',
            'title.more': 'More games at {host}',
            'info.today': "play today's wall",
            'hud.wall': 'Wall {n}',
            'launch.touch': 'Tap to launch',
            'launch.desktop': 'Space or click to launch',
            'wall.clear': 'Wall {n} cleared!',
            'wall.bonus': '+{p} points',
            'power.wide': 'Wide paddle',
            'power.multi': 'Three balls',
            'power.slow': 'Slow motion',
            'paused': 'Paused',
            'paused.hint': 'Esc or P to continue',
            'paused.hint.touch': 'Tap to continue',
            'pad.pause': 'Pause',
            'over.title': 'Wall #{n} · {date}',
            'over.points': 'points',
            'over.meta': 'Wall {w} · 🧱 {k} · best combo ×{c}',
            'over.meta.plain': 'Wall {w} · 🧱 {k} bricks',
            'over.best': 'Best today: {best}',
            'over.newbest': 'New best today!',
            'over.streak.one': 'Streak: 1 day',
            'over.streak.many': 'Streak: {n} days',
            'over.share': 'Share result',
            'over.again': 'Play again',
            'over.whatsapp': 'Send on WhatsApp',
            'over.copy': 'Copy text',
            'over.copied': 'Copied!',
            'over.try': 'Try this next',
            'over.more': 'More games at {host}',
            'share.head': 'Neon Bricks · Wall #{n} ({date})',
            'share.line': '{s} pts · wall {w}',
            'share.streak': 'streak {n}',
            'share.dare': 'Can you beat me?',
            'share.dare.score': 'I dare you to beat my {s}.',
            'target.title.bot': "Goal: beat the bot's {t}",
            'target.title.player': 'Goal: beat {t} points',
            'target.verified': 'verified score',
            'target.declared': 'score declared by your challenger',
            'target.hud': 'Goal {t}',
            'target.passed': 'You passed {t}!',
            'over.win': 'You won by {n}!',
            'over.tie': 'Tied at {t}',
            'over.lose': '{n} short',
            'joke.win.bot.0': 'Humans 1, machines 0.',
            'joke.win.bot.1': 'The bot wants a rematch. Let it wait.',
            'joke.win.bot.2': 'Not even with training.',
            'joke.tie.bot.0': 'You tied with a bot. Not sure what that says about you.',
            'joke.tie.bot.1': 'Same score as the machine. Suspicious.',
            'joke.tie.bot.2': 'A technical draw. Nobody cheers.',
            'joke.lose.bot.0': 'The bot was not even trying.',
            'joke.lose.bot.1': 'The machine is still unbeaten. For now.',
            'joke.lose.bot.2': 'A program a few lines long beat you.',
            'joke.win.player.0': 'Let them know. Gently.',
            'joke.win.player.1': 'Now it is their turn.',
            'joke.win.player.2': 'This will not end here.',
            'joke.tie.player.0': 'An exact tie. That almost never happens.',
            'joke.tie.player.1': 'Somebody has to break it.',
            'joke.tie.player.2': 'Same score. What a coincidence.',
            'joke.lose.player.0': 'So close. Or not really.',
            'joke.lose.player.1': 'One more try. Just one.',
            'joke.lose.player.2': 'Tell no one.',
            'share.win.bot': 'I beat the bot by {n} 💪 (it scored {t})',
            'share.tie.bot': 'I tied the bot at {t} 🤝',
            'share.lose.bot': "I was {n} short of the bot's {t} 😅",
            'share.win.player': 'I beat the {t} challenge by {n} 💪',
            'share.tie.player': 'I tied the challenge: {t} 🤝',
            'share.lose.player': 'I was {n} short of the {t} challenge 😅',
            'info.desktop': 'Move the paddle with the mouse or the arrow keys, launch with Space or a click, pause with Esc or P. Every day has a new wall, the same for everyone.',
            'info.touch': 'Drag your finger to move the paddle and tap to launch. Every day has a new wall, the same for everyone.',
            'info.mute': 'mute',
            'info.unmute': 'unmute',
            'info.source': 'source on GitHub',
            'info.portal': 'more games',
            'rec.neon-raiders': 'Space shooter: beat the bot.',
            'rec.neon-highway': 'Synthwave racer: beat your fastest lap.'
        }
    };

    function pickLang() {
        var forced = (window.location.search.match(/[?&]lang=(es|en)\b/) || [])[1];
        try {
            if (forced) { window.localStorage.setItem('nb.lang', forced); return forced; }
            var saved = window.localStorage.getItem('nb.lang');
            if (saved === 'es' || saved === 'en') { return saved; }
        } catch (err) { if (forced) { return forced; } }
        var nav = (navigator.language || 'es').toLowerCase();
        return nav.indexOf('en') === 0 ? 'en' : 'es';
    }

    var lang = pickLang();

    function t(key, vars) {
        var text = STRINGS[lang][key];
        if (text === undefined) { text = STRINGS.es[key]; }
        if (text === undefined) { return key; }
        return text.replace(/\{(\w+)\}/g, function (m, name) {
            return vars && vars[name] !== undefined ? vars[name] : m;
        });
    }

    function number(n) {
        try { return Number(n).toLocaleString(lang === 'es' ? 'es-EC' : 'en-US'); } catch (err) { return String(n); }
    }

    //  Short date such as "18 nov" or "Nov 18" from a YYYY-MM-DD key.
    function shortDate(dayKey) {
        var p = dayKey.split('-');
        var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
        try { return d.toLocaleDateString(lang === 'es' ? 'es-EC' : 'en-US', { day: 'numeric', month: 'short' }).replace('.', ''); }
        catch (err) { return dayKey; }
    }

    function apply(root) {
        var nodes = (root || document).querySelectorAll('[data-i18n]');
        Array.prototype.forEach.call(nodes, function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
        document.documentElement.lang = lang;
        document.title = t('page.title');
    }

    window.NeonI18n = { lang: lang, t: t, number: number, shortDate: shortDate, apply: apply };
})();
