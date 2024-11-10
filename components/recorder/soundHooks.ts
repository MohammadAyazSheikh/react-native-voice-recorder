import { Platform } from 'react-native';
import AudioRecorderPlayer,
{
    AudioSet,
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    AVModeIOSOption,
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    RecordBackType,
    PlayBackType,
} from 'react-native-audio-recorder-player';
import RNFetchBlob from "rn-fetch-blob";
import uuid from 'react-native-uuid';
import {  useMemo } from 'react';

const dirs = RNFetchBlob.fs.dirs;

//function to generate path for ios and android
const generatePath = () => {
    return Platform.select({
        ios: `file://${dirs.DocumentDir}/${uuid.v4()}.m4a`,
        android: `${dirs.DocumentDir}/${uuid.v4()}.mp3`,
    });
}
const path = generatePath();

type recordType = (e: RecordBackType) => void

export default function useSoundRecorderHooks(listenerTime: number = 0.1) {

    const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);

    const onStartRecord = async (onRecordListener: recordType) => {

        const audioSet: AudioSet = {
            AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
            AudioSourceAndroid: AudioSourceAndroidType.MIC,
            AVModeIOS: AVModeIOSOption.measurement,
            AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
            AVNumberOfChannelsKeyIOS: 2,
            AVFormatIDKeyIOS: AVEncodingOption.aac,
        };
        const meteringEnabled = true;

        await audioRecorderPlayer.setSubscriptionDuration(listenerTime)
        const result = await audioRecorderPlayer.startRecorder(path, audioSet, meteringEnabled);

        audioRecorderPlayer.addRecordBackListener((e) => {
            onRecordListener(e)
            return;
        });
        console.log("PATH: ", result);
        return result;
    };

    const onStopRecord = async (callBack?: () => void) => {
        const result = await audioRecorderPlayer.stopRecorder();
        console.log("Stopped");
        audioRecorderPlayer.removeRecordBackListener();
        callBack && callBack()
        return result;
    };

    const onStartPlay = async (onPlayListener?: (e: PlayBackType) => void) => {
        console.log('onStartPlay');
        await audioRecorderPlayer.setSubscriptionDuration(1);
        const uri = await audioRecorderPlayer.startPlayer(path);
        audioRecorderPlayer.addPlayBackListener((e) => {
            onPlayListener && onPlayListener(e)
            return;
        });
    };

    const onPausePlay = async (callback?: () => void) => {
        console.log('onPausePlay');
        await audioRecorderPlayer.pausePlayer();
        // audioRecorderPlayer.removeRecordBackListener();
        callback && callback()
    };

    const onResumePlay = async (callback?: () => void) => {
        console.log('onResumePlay');
        await audioRecorderPlayer.resumePlayer();
        callback && callback()
    };

    const onStopPlay = async (callback?: () => void) => {
        console.log('onStopPlay');
        await audioRecorderPlayer.stopPlayer();
        await audioRecorderPlayer.removePlayBackListener();
        callback && callback()
    };

    const onSeek = async (milliseconds: number, callback?: () => void) => {
        console.log('onSeek');
        await audioRecorderPlayer.seekToPlayer(milliseconds);
        callback && callback()
    };


    return {
        onStartRecord,
        onStopRecord,
        onStartPlay,
        onPausePlay,
        onResumePlay,
        onStopPlay,
        onSeek,
        formateTime: audioRecorderPlayer.mmssss
    }

}