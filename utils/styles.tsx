import { Dimensions, PixelRatio
} from 'react-native';
let { width, height } = Dimensions.get('window');


export const widthToDp = (number: number) => {

    let givenWidth = typeof number === 'number' ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((width * givenWidth) / 100);

}

export const heightToDp = (number: number) => {

    let givenHeight = typeof number === 'number' ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((height * givenHeight) / 100);

}