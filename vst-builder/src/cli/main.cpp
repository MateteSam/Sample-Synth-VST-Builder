#include <iostream>
// vst-builder CLI: will receive an export stamp and generate/build plugin
int main(int argc, char** argv) {
    if (argc < 2) {
        std::cout << "vst-builder: specify export stamp\n";
        return 1;
    }
    std::string stamp = argv[1];
    std::cout << "vst-builder: would generate plugin for export " << stamp << "\n";
    // Placeholder: actual generation and building happens here
    return 0;
}
