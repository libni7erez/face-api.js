import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {connect } from "react-redux";
import mapStateToProps from './mapStateToProps';
import mapDispatchToProps from './mapDispatchToProps';
import Camera from './Camera'; 
import Canva from './Canva'; 
import * as faceapi from 'face-api.js';

class FacePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            controller:'game',
            loading: false,
            authorized:false,
            checkAutorization:true,
            positionIndex:0,
        }
        this.setVideoHandler = this.setVideoHandler.bind(this);
        this.isModelLoaded =  this.isModelLoaded.bind(this);
    }
    
    //
    async setVideoHandler(){
        if (this.isModelLoaded()!==undefined){
            try{
                let result= await faceapi.detectSingleFace(this.props.video.current, this.props.detector_options).withFaceLandmarks().withAgeAndGender().withFaceExpressions();

                if (result!==undefined){
                    //console.log("face detected",result);
                    const dims = faceapi.matchDimensions(this.props.canvas.current, this.props.video.current, true);
                    const resizedResult = faceapi.resizeResults(result, dims);
                    //faceapi.draw.drawDetections(this.props.canvas.current, resizedResult);
                    //faceapi.draw.drawFaceLandmarks(this.props.canvas.current, resizedResult);
                    const {age, gender, genderProbability}=result
                    new faceapi.draw.DrawTextField(
                        [
                        `${faceapi.utils.round(age,0)} years`,
                        `${gender} (${faceapi.utils.round(genderProbability)})`
                        ],
                        result.detection.box.bottomRight).draw(this.props.canvas.current);

                    faceapi.draw.drawFaceExpressions(this.props.canvas.current,resizedResult);
                    

                //ADD CANVAS
                    const currentCanvas = ReactDOM.findDOMNode(this.props.canvas.current);
                    var canvasElement = currentCanvas.getContext("2d");
                    //ctx.lineTo(x,y);
                    //ctx.stroke();
                    /**/
                    canvasElement.fillStyle = 'rgb(255, 87, 51)';
                    //ctx.fillRect(result.alignedRect.box.x, result.alignedRect.box.y, 100, 50);
                    // jaw 0-16  left eyebrow  17-21 right eyebrow  22-26  nose 27-35  left eye 36-41  right eye 42-47 and mouth 48-67
                     
                    canvasElement.fillRect(result.landmarks.positions[this.state.positionIndex].x,
                                 result.landmarks.positions[this.state.positionIndex].y, 
                                 10, 10);
                    canvasElement.closePath();

                    //AGREGA LOS LENTE
                    canvasElement.font="30px Arial";
                    canvasElement.fillStyle = "red";
                    let positionX=result.landmarks.positions[27].x,
                        positionY=result.landmarks.positions[27].y-70;
                    canvasElement.strokeText( (result.gender)==="male" ? "Hombre" :"Mujer", 
                        positionX,positionY );

                    let base_image = new Image();
                    base_image.src = 'https://svgsilh.com/svg/311831.svg';//svgsilh.com/svg/306909.svg'*/;
                    base_image.onload = function(){

                        canvasElement.drawImage(base_image, result.landmarks.positions[36].x-25, 
                                                    /*Posición de los lentes*/
                             result.landmarks.positions[41].y-23,170,60);
                        }

                    let base_bigote = new Image();
                    base_bigote.src = 'https://svgsilh.com/svg/1308396-795548.svg'/*'https://svgsilh.com/svg/306909.svg'*/;
                    base_bigote.onload = function(){

                        canvasElement.drawImage(base_bigote, result.landmarks.positions[20].x-34, 
                                                     /*Posición de los Bigotes*/
                             result.landmarks.positions[30].y-3,150,80);
                        }  


                }
            }catch(exception){
                console.log(exception);
            }
        }
        setTimeout(() => this.setVideoHandler());
    }

    isModelLoaded(){
        if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1){
            return faceapi.nets.ssdMobilenetv1.params;
        } 
        if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) {
            return faceapi.nets.tinyFaceDetector.params;
        }
    }

    
    async componentDidMount() {
        console.log("height: "+window.screen.height+", width: "+window.screen.width);
        
        this.setDetectorOptions();
        this.props.SET_VIDEO_HANDLER_IN_GAME_FACENET(this.setVideoHandler);
        
        let modelFolder="/models";
        try{
            await faceapi.loadFaceLandmarkModel(modelFolder);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelFolder);
            await faceapi.nets.ageGenderNet.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1){
                await faceapi.nets.ssdMobilenetv1.loadFromUri(modelFolder);
            }
                
            if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) {
                await faceapi.nets.tinyFaceDetector.load(modelFolder);
            }
        }catch(exception){
            console.log("exception",exception);
        }        
    }

    setDetectorOptions() {
        let minConfidence = this.props.min_confidence,
            inputSize= this.props.input_size,
            scoreThreshold= this.props.score_threshold;

        //Identificar el modelo Provisamento entrenado para reconocer rostros.
        // el modelo por defecto es tiny_face_detector
        let options= this.props.selected_face_detector === this.props.SSD_MOBILENETV1
          ? new faceapi.SsdMobilenetv1Options({ minConfidence })
          : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
        this.props.SET_DETECTOR_OPTIONS_IN_GAME_FACENET(options);
    }
 
    render() {
        return (
            <div>
                <Camera/>
                <Canva/>
                <input type="number" 
                    style={{marginLeft:1000}} 
                    value={this.state.positionIndex} 
                    onChange={(event)=>{this.setState({positionIndex: event.target.value})}}/>            
            </div>            
        )
    }
}
 
export default connect(mapStateToProps, mapDispatchToProps)(FacePage);