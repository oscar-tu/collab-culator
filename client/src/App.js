import React from 'react';
import Calculator from './Calculator.js';
import reactLogo from './logo.svg';
import './App.css';

class App extends React.Component {

	render() {
		return (
			<div className='App'>
				<h1>React Collab-culator</h1>
				<img className='appLogo' src={reactLogo}/>
				<Calculator/>
			</div>
		);
	}
}

export default App;
