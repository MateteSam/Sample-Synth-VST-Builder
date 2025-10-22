#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <windows.h>
#include <mmsystem.h>
#pragma comment(lib, "winmm.lib")

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cout << "Usage: generate_standalone <export_root>\n";
        return 1;
    }
    std::string root = argv[1];
    std::string mappingFile = root + "\\mapping.json";
    std::ifstream f(mappingFile);
    if (!f) {
        std::cout << "No mapping.json at " << mappingFile << "\n";
        return 1;
    }
    std::cout << "Standalone generator: mapping.json found.\n";
    // This generator doesn't implement playback logic; it outputs a tiny program that can be built
    // to inspect mapping and (optionally) play one sample using PlaySound.
    std::string outDir = root + "\\project_standalone";
    std::filesystem::create_directories(outDir);
    std::string maincpp = R"CPP(#include <iostream>
#include <fstream>
#include <string>
#include <windows.h>
#include <mmsystem.h>
#pragma comment(lib, "winmm.lib")
int main() {
    std::cout << "Standalone built from export.\n";
    std::ifstream f("mapping.json");
    if (!f) { std::cout << "mapping.json missing\n"; return 0; }
    std::string line;
    while (std::getline(f, line)) std::cout << line << std::endl;
    // optionally play a sample if exists in assets folder (first file)
    // PlaySound(TEXT("assets\\sample.wav"), NULL, SND_FILENAME | SND_NODEFAULT | SND_SYNC);
    return 0;
}
)CPP";
    std::ofstream ofs(outDir + "\\main.cpp");
    ofs << maincpp; ofs.close();
    std::string cmakel = R"CMAKE(cmake_minimum_required(VERSION 3.10)
project(ExportStandalone)
add_executable(ExportStandalone main.cpp)
)CMAKE";
    std::ofstream cof(outDir + "\\CMakeLists.txt"); cof << cmakel; cof.close();
    std::cout << "Generated standalone CMake project in: " << outDir << "\n";
    return 0;
}
