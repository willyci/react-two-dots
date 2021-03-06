import React from 'react';
import styled from 'styled-components';

import Chance from './Chance';
import Goal from '../Goal';
import Setting from './Setting';

const Background = styled.nav`
  position: fixed;
  z-index: 1;
  top: 0;
  width: 100%;
  height: 60px;

  background-color: #f0f0f1;
  border-bottom-right-radius: 15px;
  border-bottom-left-radius: 15px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const TopBar = props => (
  <Background>
    <Chance chance={props.chance} />
    <Goal goals={props.goals} showClear={true} />
    <Setting onClickSetting={props.onClickSetting} />
  </Background>
);

export default TopBar;
