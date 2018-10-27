

## Get Started

- Install node.js
- VS Code

Install yarn

```
npm install yarn -g
```


```
git clone https://github.com/nodesense/esp-sense

cd esp-sense

```

## Yarn commands

```
yarn flash
yarn fs
yarn init-js
yarn console
```

## Flash all files

```bash
mos build --arch esp32 && mos flash
```

## Put all FS files (quick mode)

```
 mos put fs/*.js && mos call Sys.Reboot && mos console
 ```

## Put init.js files (quick mode)

```
 mos put fs/init.js && mos call Sys.Reboot && mos console
```

## Get Mac Address

```
mos call Sys.GetInfo
```

# WIFI

# Config

# FS

# Modbus

# Buffer