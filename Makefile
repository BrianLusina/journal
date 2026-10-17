ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
include $(ROOT_DIR)/.make/common.mk

# supabase commands
include $(ROOT_DIR)/.make/supabase.mk

# docker commands
include $(ROOT_DIR)/.make/docker.mk

# dev commands
include $(ROOT_DIR)/.make/dev.mk
