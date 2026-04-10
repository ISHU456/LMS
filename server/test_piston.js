const makeReq = async () => {
    try {
        const response = await fetch('https://piston.codebreaker.org/api/v2/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python',
                version: '*',
                files: [{ content: 'print(input() + " world")' }],
                stdin: 'hello'
            })
        });
        console.log(await response.json());
    } catch(e) {}
};
makeReq();
