#include "PluginProcessor.h"
#include <iostream>

PluginProcessor::PluginProcessor() {}
PluginProcessor::~PluginProcessor() {}

void PluginProcessor::prepare() { std::cout << "prepare\n"; }
void PluginProcessor::process() { std::cout << "process\n"; }
