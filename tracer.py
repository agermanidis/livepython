#!/usr/bin/env python

import json
import linecache
import os
import sys
import threading
import inspect
import time

last_call = None
def debounce(wait):
    def decorator(fn):
        def debounced(*args, **kwargs):
            global last_call
            def call_it():
                global last_call
                args, kwargs = last_call
                fn(*args, **kwargs)
                last_call = None
            if last_call is None:
                debounced.t = threading.Timer(wait, call_it)
                debounced.t.start()
            last_call = (args, kwargs)
        return debounced
    return decorator

def log(msg):
    print('[LIVEPYTHON_TRACER] %s' % msg)
    sys.stdout.flush()

@debounce(0.01)
def log_frame(frame, should_update_source):
    log(json.dumps(generate_call_event(frame, should_update_source)))

starting_filename = os.path.abspath(sys.argv[1])
starting_dir = os.path.dirname(starting_filename)

# tracer_path = os.path.relpath(os.path.abspath(__file__), starting_dir)

os.chdir(starting_dir)
sys.path.insert(0, starting_dir)

current_filename = None
current_line = None
current_locals = {}
failed = False

def should_ignore_variable(name, value):
    return name.startswith('__') and name.endswith('__')

def truncate_list(l):
    if len(l) > 3:
        ret  = ', '.join(map(process_variable, l[:2]))
        ret += ", ..., "
        ret += process_variable(l[-1])
        return ret
    else:
        return ', '.join(map(process_variable, l))

def format_function(f):
    args = inspect.getargspec(f).args
    return "function(%s)" % truncate_list(args)

def format_list(l):
    return "[%s]" % truncate_list(l)

def process_variable(var):
    type_name = type(var).__name__
    if type_name == 'list':
        return format_list(var)
    elif type_name == 'module':
        return "<module '%s'>" % var.__name__
    else:
        return str(var)

def get_module_name(full_path):
    global starting_filename
    return os.path.relpath(
        os.path.abspath(full_path),
        os.path.dirname(os.path.abspath(starting_filename))
    )

def generate_switch_event(filename):
    return {
        'type': 'switch',
        'filename': get_module_name(filename),
        'source': ''.join(linecache.getlines(filename)),
    }

def generate_call_event(frame, should_update_source):
    # frame_locals = {k: {'value': process_variable(v), 'type': type(v).__name__} for k, v in frame.f_locals.items() if not should_ignore_variable(k, v)}
    obj = {
        'type': 'call',
        'filename': get_module_name(frame.f_code.co_filename),
        'lineno': frame.f_lineno,
        # 'frame_locals': frame_locals,
        # 'function_name': frame.f_code.co_filename,
        # 'time': time.time()
        'source': ''.join(linecache.getlines(frame.f_code.co_filename))
    }
    # if should_update_source:
        # obj['source'] = ''.join(linecache.getlines(frame.f_code.co_filename))
    return obj
    
def generate_exception_event(e):
    return {
        'type': 'exception',
        'exception_type': type(e).__name__,
        'exception_message': str(e),
        'filename': current_filename,
        'lineno': current_line,
        'time': time.time()
    }

def local_trace(frame, why, arg):
    global failed
    global current_line
    global current_filename
    global starting_dir

    if failed:
        return
    
    if why == 'exception':
        exc_type = arg[0].__name__
        exc_msg = arg[1]
        #print "%s: %s" % (, )
        #conn.send(json.dumps(generate_exception_event(frame, exc_type, exc_msg))+'\n')
        return
    #print frame, why, arg, inspect.getframeinfo(frame)

    should_update_source = current_filename != frame.f_code.co_filename
    current_filename = frame.f_code.co_filename
    current_line = frame.f_lineno

    if not current_filename.startswith(starting_dir):
        return

    if 'livepython' in current_filename:
        return

    if 'site-packages' in current_filename:
        return

    if 'lib/python' in current_filename:
        return

    log_frame(frame, should_update_source)
    return local_trace

def global_trace(frame, why, arg):
    return local_trace

with open(starting_filename) as fp:
    code = compile(fp.read(), starting_filename, 'exec')

namespace = {
    '__file__': starting_filename,
    '__name__': '__main__',
}


log(json.dumps({
    'type': 'start',
    'startmodule': starting_filename
}))

sys.settrace(global_trace)
threading.settrace(global_trace)

try:
    sys.argv = sys.argv[1:]
    exec(code, namespace)
    log(json.dumps({'type': 'finish'}))
except Exception as err:
    failed = True
    log(json.dumps(generate_exception_event(err)))

sys.settrace(None)
threading.settrace(None)
