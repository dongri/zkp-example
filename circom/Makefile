SIZE ?= 12
CIRCUIT ?= auth
OUTPUT = output/$(CIRCUIT)

.PHONY: key
key:
	mkdir -p $(OUTPUT)
	npx snarkjs powersoftau new bn128 $(SIZE) $(OUTPUT)/POT12_0.ptau -v
	npx snarkjs powersoftau contribute $(OUTPUT)/POT12_0.ptau $(OUTPUT)/POT12_1.ptau --name="First contribution" -v -e="some random text"
	npx snarkjs powersoftau contribute $(OUTPUT)/POT12_1.ptau $(OUTPUT)/POT12_2.ptau --name="Second contribution" -v -e="some random text"
	npx snarkjs powersoftau export challenge $(OUTPUT)/POT12_2.ptau $(OUTPUT)/challenge_0003
	npx snarkjs powersoftau challenge contribute bn128 $(OUTPUT)/challenge_0003 $(OUTPUT)/response_0003 -e="some random text"
	npx snarkjs powersoftau import response $(OUTPUT)/POT12_2.ptau $(OUTPUT)/response_0003 $(OUTPUT)/POT12_3.ptau -n="Third contribution name"
	npx snarkjs powersoftau verify $(OUTPUT)/POT12_3.ptau
	npx snarkjs powersoftau beacon $(OUTPUT)/POT12_3.ptau $(OUTPUT)/POT12_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"
	npx snarkjs powersoftau prepare phase2 $(OUTPUT)/POT12_beacon.ptau $(OUTPUT)/POT12_final.ptau -v
	npx snarkjs powersoftau verify $(OUTPUT)/POT12_final.ptau

.PHONY: build
build:
	mkdir -p $(OUTPUT)
	circom circuit/$(CIRCUIT).circom --r1cs --wasm --sym --c --output $(OUTPUT)
	npx snarkjs r1cs export json $(OUTPUT)/$(CIRCUIT).r1cs $(OUTPUT)/$(CIRCUIT).r1cs.json
	npx snarkjs plonk setup $(OUTPUT)/$(CIRCUIT).r1cs $(OUTPUT)/POT12_final.ptau $(OUTPUT)/circuit_final.zkey
	npx snarkjs zkey export verificationkey $(OUTPUT)/circuit_final.zkey $(OUTPUT)/verification_key.json

.PHONY: prove
prove:
	node $(OUTPUT)/$(CIRCUIT)_js/generate_witness.js $(OUTPUT)/$(CIRCUIT)_js/$(CIRCUIT).wasm input/$(CIRCUIT).json $(OUTPUT)/witness.wtns
	npx snarkjs plonk prove $(OUTPUT)/circuit_final.zkey $(OUTPUT)/witness.wtns $(OUTPUT)/proof.json $(OUTPUT)/public.json

.PHONY: verify
verify:
	npx snarkjs plonk verify $(OUTPUT)/verification_key.json $(OUTPUT)/public.json $(OUTPUT)/proof.json

.PHONY: solidity
solidity:
	npx snarkjs zkey export solidityverifier $(OUTPUT)/circuit_final.zkey $(OUTPUT)/Verifier.sol
	npx snarkjs zkey export soliditycalldata $(OUTPUT)/public.json $(OUTPUT)/proof.json
