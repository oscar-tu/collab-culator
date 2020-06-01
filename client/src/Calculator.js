import React from 'react';
import CalculationLog from './CalculationLog';

import { w3cwebsocket as W3CWebSocket } from 'websocket';
const client = new W3CWebSocket('ws://127.0.0.1:1234');

export default class ResultArea extends React.Component {
	
	constructor(props) {
		super(props);

		// List of acceptable operations
		this.operations = ['÷', 'x', '-', '+', '='];

		// Our state will consist of the display value,
		// 1st/2nd operand value/status, current operator,
		// current # of users in the room, and history (log).
		this.state = {
			displayValue: '0',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
			users: 0,
			history: [],
		}
	}

	// When component mounts, send a new connection message
	// and setup component to receive messages from server
	componentDidMount() {
		client.onopen = () => {
			// console.log('WebSocket Client Connected');
			client.send(JSON.stringify({data: "new connect", type: 'userEvent'}));
		};

		client.onmessage = (message) => {
			// console.log('Got message from server!');
			const data = JSON.parse(message.data);
			if (data.type === 'userEvent') {
				this.setState({
					users: data.data,
				});
			} else {
				this.setState(data);
			}
		};
	}

	// Return the arithmetic value of our parameters
	evaluate(op, a, b) {
		switch(op) {
			case '÷':
				return a/b;
			case 'x':
				return a*b;
			case '-':
				return a-b;
			case '+':
				return a+b;
			case '=':
				return b;
			default:
				return b;
		}
	}

	// Operator handler. We update our display value everytime 
	// an operator is pressed, and based on various state values
	// we may perform an evaluation to get an answer.
	handleOperator(op) {
		let msg = {};
		let input = parseFloat(this.state.displayValue);

		// If we have already selected an operator and press another operator
		if (this.state.operator && this.state.waitingForSecondOperand) {
			return {
				operator: op,
			};
		}

		// First operand, if not set already, is now whatever is currently
		// on the screen/displayValue. 
		if (this.state.firstOperand === null) {
			msg = {
				firstOperand: input,
			};

		// Otherwise if we press an operator and already have firstOperand 
		// *and* a display value
		} else if (this.state.operator) {
			let previousDisplayValue = this.state.firstOperand || 0;

			// Get current result of the "previous" operator (most recent one
			// we pressed before this current operator) evaluated between
			// the previousDisplayValue and input (current displayValue);
			let res = this.evaluate(this.state.operator, previousDisplayValue, input);
			
			// Update message to be sent to server and re-emitted to all clients
			msg = {
				displayValue: res,
				firstOperand: res,
			};

			// If any evaluation was made and the last one wasn't an equals
			// sign, then we update our calculation log. 
			if (this.state.operator !== '=') {
				let item = previousDisplayValue + ' ' + this.state.operator + ' ' + input + ' = ' + res;
				if (this.state.history.length < 10) {
					msg['history'] = [...this.state.history, item];	
				} else {
					msg['history'] = [...this.state.history.slice(1), item];
				}	
			}
		}

		// Now displayValue is updated and we have a firstOperand,
		// set the state values to new updated operator et al.
		msg['waitingForSecondOperand'] = true;
		msg['operator'] = op;

		return msg;
	}

	// Insert decimal into displayValue
	handleDecimal() {
		let msg = {};
		if (this.state.waitingForSecondOperand) return msg;

		if (!this.state.displayValue.includes('.')) {
			msg = {
				displayValue: this.state.displayValue + '.',
			};
		}
		return msg;
	}

	// Reset state
	handleClear() {
		return {
			displayValue: '0',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
		};
	}

	// Swap +/- sign
	handlePosNeg() {
		return {
			displayValue: this.state.displayValue === '0' ? '0' : (-1 * parseFloat(this.state.displayValue)),
		};
	}

	// Handle digits. If we press a digit and we are still waiting
	// for a second operand, then update displayvalue and set it 
	// to false. Otherwise just add on the digit as a 2/3/4...digit number
	handleDigit(value) {
		let msg = '';
		if (this.state.waitingForSecondOperand) {
			msg = {
				displayValue: value,
				waitingForSecondOperand: false,
			};
		} else {
			msg = {
				displayValue: this.state.displayValue === '0' ? value : this.state.displayValue + value,
			};
		}
		return msg;
	}

	// Clear history log by sending a blank log back to server to be emitted
	clearHistoryLog() {
		client.send(JSON.stringify({data: {history: []}, type: 'clickEvent'}));
	}

	// Button onClick event handler
	handleClickEvent(value) {
		let message = '';
		if (this.operations.includes(value)) {
			message = this.handleOperator(value);
		} else if (value === '.') {
			message = this.handleDecimal();
		} else if (value === 'AC') {
			message = this.handleClear();
		} else if (value === '+/-') {
			message = this.handlePosNeg();
		} else {
			message = this.handleDigit(value);
		}

		// Send the state to be updated as a message
		client.send(JSON.stringify({data: message, type: 'clickEvent'}));
	}

	render() {
		return (
			<div>
				<div className='container'>
					<div className='card'>
						<br/><br/>
						<h2>Connected users: {this.state.users}</h2>
						<textarea placeholder='Enter a calculation' id='result' rows='1' cols='20' value={this.state.displayValue} readOnly={true}>
						</textarea>
						<br/><br/>
						<button className='allClearButton' onClick={() => this.handleClickEvent('AC')}>AC</button>
						<button className='clearLogButton' onClick={() => this.clearHistoryLog()} title='Clear Log'>C.L.</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('+/-')}>+/-</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('÷')}>÷</button>
						<br/>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('7')}>7</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('8')}>8</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('9')}>9</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('x')}>x</button>
						<br/>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('4')}>4</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('5')}>5</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('6')}>6</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('-')}>-</button>
						<br/>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('1')}>1</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('2')}>2</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('3')}>3</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('+')}>+</button>
						<br/>
						<button className='zeroButton' onClick={() => this.handleClickEvent('0')}>0</button>
						<button className='calculatorButton' onClick={() => this.handleClickEvent('.')}>.</button>
						<button className='equalsButton' onClick={() => this.handleClickEvent('=')}>=</button>
						<br/>
						<br/><br/><br/>
						<CalculationLog log={this.state.history}/>
						<br/><br/><br/>
					</div>
				</div>
			</div>
		)
	}
}
