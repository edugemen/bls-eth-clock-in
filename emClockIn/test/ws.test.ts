const WorkingScrow = artifacts.require("WorkingScrow");

contract('WorkingScrow', accounts => {
    const evilNode = accounts[0];
    const verifierNode = accounts[1];
    const anotherNode1 = accounts[2];
    const anotherNode2 = accounts[3];
    let workingScrow


    before(async() => {
        workingScrow = await WorkingScrow.new();
    })

    it('should hello', async() => {
        assert(3 == 3);
    })

})
