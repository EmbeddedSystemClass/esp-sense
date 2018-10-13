# Get Started

```
git clone https://github.com/nodesense/esp-sense

cd esp-sense

```

# Flash all files

```bash
mos build --arch esp32 && mos flash
```

# Put all FS files (quick mode)

```
 mos put fs/*.js && mos call Sys.Reboot && mos console
 ```

# Put init.js files (quick mode)

```
 mos put fs/init.js && mos call Sys.Reboot && mos console
```

# WIFI

# Config

# FS

# Modbus

# Buffer