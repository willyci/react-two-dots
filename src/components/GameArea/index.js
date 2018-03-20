// Level 7 best for test progress bar
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VerticalProgress, HorizonProgress } from './ProgressBar';
import DotArray from './DotArray';

class GameArea extends Component {
  render() {
    const { showBoard, array, color, rectangle } = this.props;
    let { progress } = this.props;
    if (rectangle) {
      // fullfill all progress
      progress = 12;
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '60px',
          bottom: '60px',
          display: 'flex',
          flexDirection: 'column',
          left: '0px',
          right: '0px'
        }}
      >
        <HorizonProgress progress={progress} color={color} />
        <div
          style={{
            display: 'flex',
            flex: '1',
            flexDirection: 'row',
            justifyContent: 'space-between',
            height: '100%'
          }}
        >
          <div>
            <VerticalProgress progress={progress - 6} color={color} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {showBoard && <DotArray array={array} />}
          </div>
          <div>
            <VerticalProgress progress={progress - 6} color={color} />
          </div>
        </div>
        <HorizonProgress progress={progress} color={color} />
      </div>
    );
  }
}

export default connect(state => ({
  showBoard: state.gameArea.showBoard,
  array: state.gameArea.array,
  progress: state.gameArea.connectedLines.length,
  color: state.gameArea.dotColor,
  rectangle: state.gameArea.rectangle
}))(GameArea);