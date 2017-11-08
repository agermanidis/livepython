#!/usr/bin/env python

import json
import linecache
import os
import sys
import threading
import inspect
import time
import socket

state = {
    'speed': 'slow'
}

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("localhost", 4387))
s.setblocking(False)

def debounce(wait):
    def decorator(fn):
        class context:
            last_call = None
        def debounced(*args, **kwargs):
            def call_it():
                args, kwargs = context.last_call
                fn(*args, **kwargs)
                context.last_call = None
            if context.last_call is None:
                debounced.t = threading.Timer(wait, call_it)
                debounced.t.start()
            context.last_call = (args, kwargs)
        return debounced
    return decorator


def log(msg):
    try:
        s.send(bytes(msg+'\n', 'utf8'))
    except:
        s.send(msg+'\n')


@debounce(0.1)
def log_frame(frame):
    log(json.dumps(generate_call_event(frame)))


starting_filename = os.path.abspath(sys.argv[1])
starting_dir = os.path.dirname(starting_filename)

os.chdir(starting_dir)
sys.path.insert(0, starting_dir)

current_filename = None
current_line = None
current_locals = {}
failed = False


def should_ignore_variable(name):
    return name.startswith('__') and name.endswith('__')


def truncate_list(l):
    if len(l) > 3:
        ret = ', '.join(map(process_variable, l[:2]))
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


def generate_call_event(frame):
    frame_locals = {k:
       {'value': process_variable(v), 'type': type(v).__name__}
       for k, v in frame.f_locals.items() if not should_ignore_variable(k)
    }
    frame_globals = {k:
       {'value': process_variable(v), 'type': type(v).__name__}
       for k, v in frame.f_globals.items() if not should_ignore_variable(k)
    }
    obj = {
        'type': 'call',
        'frame_locals': frame_locals,
        'frame_globals': frame_globals,
        'filename': get_module_name(frame.f_code.co_filename),
        'lineno': frame.f_lineno,
        'source': ''.join(linecache.getlines(frame.f_code.co_filename))
    }
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


def process_msg(msg):
    global state
    if type(msg) == bytes:
        msg = msg.decode('utf8')
    msg = json.loads(msg)
    if msg['type'] == 'change_speed':
        print('changed speed')
        state['speed'] = msg['speed']


def local_trace(frame, why, arg):
    try:
        received_msg = s.recv(1024)
        process_msg(received_msg)
    except:
        pass

    global current_line
    global current_filename

    if failed:
        return

    if why == 'exception':
        exc_type = arg[0].__name__
        exc_msg = arg[1]
        return

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

    log_frame(frame)

    if state['speed'] == 'slow':
        time.sleep(1)

    return local_trace


def global_trace(frame, why, arg):
    return local_trace


with open(starting_filename, 'rb') as fp:
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
finally:
    sys.settrace(None)
    threading.settrace(None)
