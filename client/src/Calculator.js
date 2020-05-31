import React from 'react';
import CalculationLog from './CalculationLog';

import { w3cwebsocket as W3CWebSocket } from 'websocket';
const client = new W3CWebSocket('ws://127.0.0.1:1234');

export default class ResultArea extends React.Component {
	
	constructor(props) {
		super(props);
		this.operations = ['÷','/', 'x', '-', '+', '='];
		this.state = {
			displayValue: '0',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
			users: 0,
			history: [],
		}
	}


	componentDidMount() {
		client.onopen = () => {
			console.log('WebSocket Client Connected');
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

		document.addEventListener('keydown', this.handleKeyPress);
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.handleKeyPress);
	}

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

	handleOperator(op) {
		let msg = '';
		let input = parseFloat(this.state.displayValue);

		if (this.state.operator && this.state.waitingForSecondOperand) {
			return {
				operator: op,
			};
		}

		if (this.state.firstOperand === null) {
			msg = {
				firstOperand: input,
			};
		} else if (this.state.operator) {
			let currentValue = this.state.firstOperand || 0;
			let res = this.evaluate(this.state.operator, currentValue, input);
			
			msg = {
				displayValue: res,
				firstOperand: res,
			};

			if (this.state.operator !== '=') {
				let item = currentValue + ' ' + this.state.operator + ' ' + input + ' = ' + res;
				if (this.state.history.length < 10) {
					msg['history'] = [...this.state.history, item];	
				} else {
					msg['history'] = [...this.state.history.slice(1), item];
				}	
			}
		}

		msg['waitingForSecondOperand'] = true;
		msg['operator'] = op;

		return msg;
	}

	handleDecimal() {
		let msg = ''
		if (this.state.waitingForSecondOperand) return msg;

		if (!this.state.displayValue.includes('.')) {
			msg = {
				displayValue: this.state.displayValue + '.',
			};
		}
		return msg;
	}

	handleClear() {
		return {
			displayValue: '0',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
		};
	}

	handlePosNeg() {
		return {
			displayValue: this.state.displayValue === '0' ? '0' : (-1 * parseFloat(this.state.displayValue)),
		};
	}

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

	clearHistoryLog() {
		client.send(JSON.stringify({data: {history: []}, type: 'clickEvent'}));
	}

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
