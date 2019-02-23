import React, { Component } from 'react';
import './InfoTable.css';

class InfoTable extends Component {
	render() {
		return (
			<table className="InfoTable"><tbody>
				{ this.props.children }
			</tbody></table>
		);
	}
}

export { InfoTable };