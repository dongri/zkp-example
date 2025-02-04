## contract

## Init

```shell
$ forge init
```

## Copy Verifier.sol

```shell
$ cp ../circom/output/auth/Verifier.sol ./src/
```


### Build

```shell
$ forge build
```

### Format

```shell
$ forge fmt
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ mv .env.example .env
$ vim .env

$ forge script script/Deployment.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```
