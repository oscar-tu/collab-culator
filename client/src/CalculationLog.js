import React from 'react';
import './App.css';

export default class CalculationLog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {

		}
	}

	render() {
		return (
			<div className='container'>
				<div className='log'>
					<br/>
					<h2><u>Calculation Log (last 10, most recent first)</u></h2>
					{this.props.log.slice(0).reverse().map((value, index) => {
						return (
							<p key={index}>{value}</p>
						)
					})}
					<br/>
				</div>
			</div>
		);
	}
}
