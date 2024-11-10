import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, StretchInY, interpolate, Extrapolation } from "react-native-reanimated";
import IconFa from '@expo/vector-icons/FontAwesome';
import moment from "moment";
import { PlayBackType } from "react-native-audio-recorder-player";
import { widthToDp } from "../../utils/styles";
import useSoundRecorder from "./soundHooks";


const BAR_WIDTH = widthToDp(3);
const SPACE_WIDTH = widthToDp(1.5);
const BAR_TOTAL_WIDTH = BAR_WIDTH + SPACE_WIDTH;
const WIDTH = widthToDp(70);

const SoundRecorder = () => {

    const { onStartRecord, onStopRecord, onStartPlay, onStopPlay } = useSoundRecorder(0.5);

    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    //state for holding playing position
    const [currentTime, setCurrentTime] = useState<PlayBackType>();
    //state for holding metering (sound level) 
    const [voiceData, setVoiceData] = useState<{ metering: number, isPastBar?: boolean }[]>([]);


    //animated value for translating bar container
    const animTranslate = useSharedValue(0);
    //animated value for making 1st var width equal to the past bars width 
    const animPastBarsWidth = useSharedValue(BAR_TOTAL_WIDTH);

    const stylesAnimBarContainer = useAnimatedStyle(() => ({
        transform: [{ translateX: -animTranslate.value }],
    }), [animTranslate]);

    const styles1stBar = useAnimatedStyle(() => ({
        width: animPastBarsWidth.value
    }), [animPastBarsWidth]);


    const isSliding = useRef(false);

    const record = useCallback(async () => {
        const uri = await onStartRecord((e) => {
            setVoiceData((prev) => {
                isSliding.current = false;
                if ((BAR_TOTAL_WIDTH * prev.length) >= WIDTH) {
                    isSliding.current = true;
                    animPastBarsWidth.value += BAR_TOTAL_WIDTH;
                    //replacing unused old bars with one long single bars
                    //to avoid lagging 
                    const latest = [...prev];
                    latest.shift();
                    latest[0] = { isPastBar: true, metering: latest[0].metering };

                    return [...latest, { metering: e.currentMetering || 0 }];
                }
                return [...prev, { metering: e.currentMetering || 0, isPastBar: false }]
            });

        });
    }, [])


    useEffect(() => {
        //translating bar container to the left
        if ((BAR_TOTAL_WIDTH * voiceData.length) >= WIDTH
            && isSliding.current && isRecording) {
            isSliding.current = false;
            animTranslate.value =
                withTiming(animTranslate.value + BAR_TOTAL_WIDTH, {

                    //idk why withTiming slows down after sometime,
                    //that's why i've assign duration 470ms to withTiming 
                    //and 500ms to the recording callback 
                    //for syncing recording callback & translate animation  

                    duration: 470,
                    easing: Easing.linear,
                })
        }

    }, [voiceData]);
    return (
        <View style={styles.container}>
            {
                // recorder
                isRecording ?
                    <View style={styles.recorderContainer}>
                        <View style={styles.recorderBody}>
                            <Animated.View style={[styles.barContainer, stylesAnimBarContainer]}>
                                {
                                    voiceData.map((b, index) => {
                                        const height = interpolate(b.metering, [-10, -5, 0], [BAR_WIDTH, 50, 100], Extrapolation.CLAMP)
                                        return (
                                            <Animated.View
                                                // entering={StretchInY.duration(100)}
                                                key={index}
                                                style={[
                                                    styles.bar,
                                                    { height: height },
                                                    b?.isPastBar ? styles1stBar : {}
                                                ]}
                                            />)
                                    })
                                }
                            </Animated.View>
                        </View>
                    </View>
                    :
                    null
            }
            {
                //recording button
                !isRecording && !isPlaying ?
                    < TouchableOpacity style={styles.btnRec}
                        onPress={() => {
                            setIsRecording(true);
                            setCurrentTime(undefined)
                            record();
                        }}
                    >
                        <IconFa name="microphone" color={"white"} size={40} />
                    </TouchableOpacity>
                    :
                    null

            }
            {
                //stop and play voice button
                isRecording ?
                    < TouchableOpacity style={styles.btnRec}
                        onPress={async () => {

                            await onStopRecord();
                            onStartPlay(setCurrentTime);
                            setIsRecording(false);
                            setIsPlaying(true);
                            setVoiceData([]);
                            animPastBarsWidth.value = BAR_TOTAL_WIDTH;
                            animTranslate.value = 0;

                        }}
                    >
                        <IconFa name="stop" color={"white"} size={40} />
                    </TouchableOpacity>
                    :
                    null
            }
            {
                // reset player
                isPlaying ?
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        < TouchableOpacity style={styles.btnRec}
                            onPress={() => {
                                setIsPlaying(false);
                                setIsRecording(false);
                                setCurrentTime(undefined);
                                onStopPlay();
                            }}
                        >
                            <IconFa name="refresh" color={"white"} size={40} />
                        </TouchableOpacity>
                        <Text style={styles.txtTime}>
                            {`${moment.utc(currentTime?.currentPosition).format('mm:ss')}/${moment.utc(currentTime?.duration).format('mm:ss')}`}
                        </Text>
                    </View >
                    :
                    null
            }
        </View >
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: 'center',
        alignItems: 'center'
    },
    recorderContainer: {
        width: WIDTH - BAR_TOTAL_WIDTH * 2,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // backgroundColor:'red',
    },
    recorderBody: {
        width: WIDTH,
        height: 100,
        alignItems: "flex-start",
        borderRadius: 5,
        position: 'absolute',
        right: 0,
        top: 0
    },
    barContainer: {
        height: "100%",
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        // gap: SPACE_WIDTH
    },
    bar: {
        height: "100%",
        width: BAR_WIDTH,
        marginRight: SPACE_WIDTH,
        backgroundColor: "black",
        borderRadius: BAR_WIDTH,
    },
    btnRec: {
        width: 100,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: "tomato",
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    txtTime: {
        fontSize: 26,
        color: 'black',
        fontWeight: 'bold',
    },
})


export default SoundRecorder;