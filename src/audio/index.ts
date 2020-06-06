export * from "./audio";
export * from "./audio-manager";
export * from "./audios";

import audioAcceptOther from "../../assets/sound-accept-other.mp3";
import audioAcceptReset from "../../assets/sound-accept-reset.mp3";
import audioAcceptSelf from "../../assets/sound-accept-self.mp3";
import audioAcceptWaiting from "../../assets/sound-accept-waiting.mp3";
import audioCountdown from "../../assets/sound-countdown.mp3";
import audioFinishedFirst from "../../assets/sound-finished-first.mp3";
import audioFinishedOther from "../../assets/sound-finished-other.mp3";
import audioPass from "../../assets/sound-pass.mp3";
import audioStartGame from "../../assets/sound-start-game.mp3";
import audioTickOtherPlayer from "../../assets/sound-tick-other-player.mp3";
import audioTickOwn from "../../assets/sound-tick-own.mp3";
import audioUnpass from "../../assets/sound-unpass.mp3";

export {
    audioAcceptOther,
    audioAcceptReset,
    audioAcceptSelf,
    audioAcceptWaiting,
    audioCountdown,
    audioFinishedFirst,
    audioFinishedOther,
    audioPass,
    audioStartGame,
    audioTickOtherPlayer,
    audioTickOwn,
    audioUnpass,
};

export const allAudios = [
    { url: audioAcceptOther, gain: 1.0 },
    { url: audioAcceptReset, gain: 1.0 },
    { url: audioAcceptSelf, gain: 1.0 },
    { url: audioAcceptWaiting, gain: 1.0 },
    { url: audioCountdown, gain: 1.0 },
    { url: audioFinishedFirst, gain: 1.0 },
    { url: audioFinishedOther, gain: 1.0 },
    { url: audioPass, gain: 1.0 },
    { url: audioStartGame, gain: 1.0 },
    { url: audioTickOtherPlayer, gain: 1.0 },
    { url: audioTickOwn, gain: 1.0 },
    { url: audioUnpass, gain: 1.0 },
];
