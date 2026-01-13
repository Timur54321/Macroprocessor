package main

import (
	"embed"
	"flag"
	"fmt"
	"os"
	"os/exec"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	inputFile := flag.String("input_file", "", "Входной файл")
	flag.Parse()

	if *inputFile != "" {
		runCLI(*inputFile)
		os.Exit(0)
	} else {
		// Create an instance of the app structure
		app := NewApp()

		// Create application with options
		err := wails.Run(&options.App{
			Title:  "homework",
			Width:  1024,
			Height: 768,
			AssetServer: &assetserver.Options{
				Assets: assets,
			},
			BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
			OnStartup:        app.startup,
			Bind: []interface{}{
				app,
			},
		})

		if err != nil {
			println("Error:", err.Error())
		}
	}

}

func runCLI(inputFile string) {
	fmt.Println("Запуск в CLI режиме")

	// Запускаем Node.js и передаем аргументы
	cmd := exec.Command("node",
		"C:\\Users\\real_timur\\Documents\\projectos\\homewokr\\macroprocessor\\frontend\\src\\cli.js",
		"-input_file", inputFile, // Передаем как аргументы
	)

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Println("Ошибка запуска node:", err)
	}
}
