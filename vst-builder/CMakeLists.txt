cmake_minimum_required(VERSION 3.15)
project(vst-builder)

# This is a meta project to hold templates and tooling. Actual plugin generation will add JUCE and targets.
add_custom_target(vst-builder-help ALL
    COMMAND ${CMAKE_COMMAND} -E echo "vst-builder scaffold (no build output)"
)
