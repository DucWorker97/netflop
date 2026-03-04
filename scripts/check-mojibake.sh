#!/bin/bash
echo "Checking for mojibake..."
node scripts/check-mojibake.js
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\033[0;32mCheck passed.\033[0m"
    exit 0
else
    echo -e "\033[0;31mCheck failed.\033[0m"
    exit 1
fi
