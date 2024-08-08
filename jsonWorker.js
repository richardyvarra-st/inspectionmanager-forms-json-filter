self.addEventListener('message', function(e) {
    const jsonData = e.data;
    const filteredData = jsonData.children.flatMap(group =>
        group.children ? group.children.filter(item => item.required_rule === 'always') : []
    );
    self.postMessage(filteredData);
}, false);