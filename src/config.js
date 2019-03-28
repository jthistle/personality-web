const QUERY_VARS = {
	url: 'http://192.168.0.9:3000/graphql', 	// NOTE: change based on ip
	method: 'POST',
	headers: {
    	'Content-Type': 'application/json',
    	'Accept': 'application/json'
	},
}

export { QUERY_VARS };
export default QUERY_VARS;