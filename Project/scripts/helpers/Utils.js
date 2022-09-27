module.exports.getBorrowerSignature = async (borrower, verificatorSignature) => {
	const messageHash = ethers.utils.solidityKeccak256(["bytes"], [verificatorSignature]);
	const messageBytes = ethers.utils.arrayify(messageHash);

	return await borrower.signMessage(messageBytes);
};

module.exports.getVerificatorSignature = async (verificator, borrower, amount, docId) => {
	const messageHash = ethers.utils.solidityKeccak256(["address", "uint", "uint"], [borrower, amount, docId]);
	const messageBytes = ethers.utils.arrayify(messageHash);

	return await verificator.signMessage(messageBytes);
};
