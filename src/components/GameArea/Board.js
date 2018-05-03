import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import DotList from './DotList';
import Lines, { FIXED_LINE_HEIGHT } from '../Line/Lines';
import { offset, shape, distance, angle } from '../../utils/dom';
import {
  isAdjacent,
  isSameDot,
  lineDeg,
  rectangleExist,
  isOppositeDirection
} from '../../models/board';
import hammerDirection from '../../utils/hammerjs-direction';
import { DIRECTION_NONE } from '../../utils/constants';
import gameAreaActions from '../../store/gamearea/actions';

const BoardWrapper = styled.div``;

const initState = {
  lineLength: 0,
  lineAngle: 0,
  linePosition: {
    x: 0,
    y: 0
  },
  connectedDots: [],
  connectedLines: [],
  panningDot: -1,
  panDirection: null,
  bounceStartDots: [] // col start bounce dot
};

class Board extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    boardHeight: PropTypes.number.isRequired,
    rectangle: PropTypes.bool,
    color: PropTypes.string
  };
  // required props dont need default value
  static defaultProps = {
    rectangle: false,
    color: ''
  };

  constructor(props) {
    super(props);

    this.state = initState;
  }

  componentWillUnmount() {
    if (this.refreshTimer) cancelAnimationFrame(this.refreshTimer);
    if (this.panningEndTimer) cancelAnimationFrame(this.panningEndTimer);
  }

  handlePanStart = (e, { currentDot }) => {
    if (this.state.panningDot === -1) {
      // calculate line start position
      const dotPosition = offset(e.target);
      const dotShape = shape(e.target);
      this.setState({
        panningDot: currentDot,
        connectedDots: [currentDot],
        linePosition: {
          x: dotPosition.left + dotShape.width / 2,
          y: dotPosition.top + dotShape.height / 2 - FIXED_LINE_HEIGHT / 2
        }
      });
      this.props.gameAreaActions.panningStart(
        this.props.data[currentDot].color
      );
    }
  };

  handlePan = e => {
    const { panDirection, linePosition } = this.state;

    // calculate length and rotate
    let pointer = {
      x: e.center.x,
      y: e.center.y
    };
    this.setState({
      lineLength: distance(
        linePosition.x,
        linePosition.y,
        pointer.x,
        pointer.y
      ),
      lineAngle: angle(linePosition.x, linePosition.y, pointer.x, pointer.y)
    });

    // TODO: how to ensure accurate and just trigger once ?
    if (
      hammerDirection[e.direction] !== DIRECTION_NONE &&
      panDirection !== hammerDirection[e.direction]
    ) {
      this.setState({
        panDirection: hammerDirection[e.direction]
      });
    }
  };

  handlePanEnd = () => {
    const { gameAreaActions } = this.props;
    const { connectedDots } = this.state;

    // remove dots
    gameAreaActions.beforePanningEnd(connectedDots);
    if (connectedDots.length > 1) {
      gameAreaActions.resetDotState('clear', connectedDots); // important
    }
    // if no dots connected, clear global state
    this.setState(preState => ({
      ...initState,
      connectedDots: preState.connectedDots
    }));
  };

  handleEnterDot = (e, { currentDot }) => {
    const { data, boardHeight, color, rectangle, gameAreaActions } = this.props;
    const { panningDot, connectedDots, connectedLines } = this.state;
    if (rectangle) {
      return;
    }
    if (panningDot !== -1 && panningDot !== currentDot) {
      const { adjacent, direction } = isAdjacent(data, boardHeight)(
        panningDot,
        currentDot
      );
      // if dot is slibing dot with panningDot
      if (adjacent) {
        if (
          connectedDots.length >= 2 &&
          isSameDot(connectedDots[connectedDots.length - 2], currentDot)
        ) {
          // return to last dot
          const lastLine = connectedLines.pop();
          if (lastLine != null) {
            this.setState(preState => {
              const dots = preState.connectedDots;
              const lines = preState.connectedLines;
              const lastLine = lines.pop();
              return {
                connectedDots: dots.slice(0, dots.length - 1),
                connectedLines: lines.slice(),
                panningDot: dots[dots.length - 2],
                linePosition: { x: lastLine.x, y: lastLine.y }
              };
            });
            gameAreaActions.enterDot(currentDot, false);
          }
        } else {
          // recalculate line start position
          const dotPosition = offset(e.target);
          const dotShape = shape(e.target);
          // add new dot
          this.setState(preState => {
            const dots = preState.connectedDots;
            const lines = preState.connectedLines;

            return {
              connectedDots: dots.concat([currentDot]),
              connectedLines: lines.concat([
                {
                  direction,
                  deg: lineDeg[direction],
                  color: color,
                  ...preState.linePosition
                }
              ]),
              panningDot: currentDot,
              linePosition: {
                x: dotPosition.left + dotShape.width / 2,
                y: dotPosition.top + dotShape.height / 2 - FIXED_LINE_HEIGHT / 2
              }
            };
          });

          if (rectangleExist(connectedDots.concat([currentDot]))) {
            gameAreaActions.enterDot(currentDot, true);
          } else {
            gameAreaActions.enterDot(currentDot, false);
          }
        }
        // reset data
        gameAreaActions.resetDotState('active'); // important
      }
    }
  };

  handleLeaveDot = (e, { currentDot }) => {
    const { gameAreaActions } = this.props;

    const { panningDot, panDirection, connectedLines } = this.state;

    if (
      connectedLines.length > 0 &&
      panningDot !== -1 &&
      panningDot === currentDot &&
      isOppositeDirection(
        panDirection,
        connectedLines[connectedLines.length - 1].direction
      )
    ) {
      // leave dot for the opposite direction
      this.setState(preState => {
        const dots = preState.connectedDots;
        const lines = preState.connectedLines;
        const lastLine = lines.pop();
        return {
          connectedDots: dots.slice(0, dots.length - 1),
          connectedLines: lines.slice(),
          panningDot: dots[dots.length - 2],
          linePosition: { x: lastLine.x, y: lastLine.y }
        };
      });
      gameAreaActions.leaveDot();
    }
  };

  refreshBoard = () => {
    if (this.refreshTimer) cancelAnimationFrame(this.refreshTimer);
    this.refreshTimer = requestAnimationFrame(() => {
      this.props.gameAreaActions.refreshBoard();
      this.props.gameAreaActions.resetDotState('bounce'); // important
    });
  };

  linePanningEnd = () => {
    if (this.panningEndTimer) cancelAnimationFrame(this.panningEndTimer);
    this.panningEndTimer = requestAnimationFrame(() => {
      this.props.gameAreaActions.panningEnd(this.state.connectedDots);
      this.setState({
        connectedDots: []
      });
    });
  };

  render() {
    const { data, boardHeight, rectangle, color } = this.props;
    return (
      <BoardWrapper>
        <DotList
          data={data}
          boardHeight={boardHeight}
          onPanStart={this.handlePanStart}
          onPan={this.handlePan}
          onPanEnd={this.handlePanEnd}
          onPanCancel={this.handlePanEnd}
          onEnter={this.handleEnterDot}
          onLeave={this.handleLeaveDot}
          refreshBoard={this.refreshBoard}
          linePanningEnd={this.linePanningEnd}
        />
        <Lines {...this.state} rectangle={rectangle} color={color} />
      </BoardWrapper>
    );
  }
}

export default connect(
  // TODO: delete
  state => ({
    color: state.gameArea.dotColor,
    rectangle: state.gameArea.rectangle,
    data: state.gameArea.array,
    boardHeight: state.gameArea.boardHeight
  }),
  dispatch => ({
    gameAreaActions: bindActionCreators(gameAreaActions, dispatch)
  })
)(Board);