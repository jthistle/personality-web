const QUERY_VARS = {
	url: 'http://localhost:4000/graphql',
	method: 'POST',
	headers: {
    	'Content-Type': 'application/json',
    	'Accept': 'application/json',
    	'Access-Control-Allow-Origin': '*',
	}
}

export { QUERY_VARS };
export default QUERY_VARS;